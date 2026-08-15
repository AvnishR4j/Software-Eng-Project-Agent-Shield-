"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { ArrowRight, Check, ChevronRight, File, FilePlus2, FolderOpen, KeyRound, LoaderCircle, LogOut, ShieldCheck, UploadCloud, X } from "lucide-react";
import { allowedPublishers, deliverableTypes, members } from "@/lib/content";

type SelectedFile = { file: File; path: string };
type Config = { configured: boolean; url: string; key: string };
type Activity = { action: string; actor_email: string; created_at: string; metadata: { title?: string; version?: string; files?: number } };

export function AdminPortal() {
  const [config, setConfig] = useState<Config | null>(null);
  const [client, setClient] = useState<SupabaseClient | null>(null);
  const [sessionEmail, setSessionEmail] = useState("");
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginState, setLoginState] = useState<"idle" | "signing-in">("idle");
  const [loginError, setLoginError] = useState("");
  const [passwordPanel, setPasswordPanel] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [files, setFiles] = useState<SelectedFile[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [authors, setAuthors] = useState<string[]>(members.map((member) => member.name));
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [type, setType] = useState("Presentation");
  const [version, setVersion] = useState("v1");
  const [publishedDate, setPublishedDate] = useState(new Date().toISOString().slice(0, 10));
  const [changeSummary, setChangeSummary] = useState("");
  const [commitUrl, setCommitUrl] = useState("");
  const [deploymentUrl, setDeploymentUrl] = useState("");
  const [preview, setPreview] = useState(false);
  const [progress, setProgress] = useState(0);
  const [publishing, setPublishing] = useState(false);
  const [publishError, setPublishError] = useState("");
  const [publishedUrl, setPublishedUrl] = useState("");
  const [activity, setActivity] = useState<Activity[]>([]);
  const fileInput = useRef<HTMLInputElement>(null);
  const folderInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/admin/config").then(async (response) => await response.json() as Config).then((value) => {
      setConfig(value);
      if (!value.configured) return;
      const supabase = createClient(value.url, value.key, { auth: { persistSession: true, detectSessionInUrl: true, flowType: "implicit" } });
      setClient(supabase);
      supabase.auth.getSession().then(({ data }) => setSessionEmail(data.session?.user.email?.toLowerCase() ?? ""));
      const { data } = supabase.auth.onAuthStateChange((_event, session) => setSessionEmail(session?.user.email?.toLowerCase() ?? ""));
      return () => data.subscription.unsubscribe();
    }).catch(() => setConfig({ configured: false, url: "", key: "" }));
  }, []);

  useEffect(() => {
    if (!client || !sessionEmail || !allowedPublishers.includes(sessionEmail)) return;
    getToken(client).then((token) => fetch("/api/admin/activity", { headers: { Authorization: `Bearer ${token}` } })).then(async (response) => await response.json() as { activity?: Activity[] }).then((data) => setActivity(data.activity ?? [])).catch(() => undefined);
  }, [client, sessionEmail, publishedUrl]);

  const totalSize = useMemo(() => files.reduce((total, item) => total + item.file.size, 0), [files]);
  const approved = allowedPublishers.includes(sessionEmail);

  async function signIn(event: FormEvent) {
    event.preventDefault();
    setLoginError("");
    if (!client || !allowedPublishers.includes(loginEmail.toLowerCase())) { setLoginError("Use one of the five approved Thapar email addresses."); return; }
    setLoginState("signing-in");
    const { error } = await client.auth.signInWithPassword({ email: loginEmail.toLowerCase(), password: loginPassword });
    if (error) { setLoginState("idle"); setLoginError(error.message); return; }
    setLoginState("idle");
  }

  async function signInWithGoogle() {
    setLoginError("");
    if (!client) return;
    setLoginState("signing-in");
    const { error } = await client.auth.signInWithOAuth({ provider: "google", options: { redirectTo: `${window.location.origin}/admin` } });
    if (error) { setLoginState("idle"); setLoginError(error.message); }
  }

  async function savePassword(event: FormEvent) {
    event.preventDefault();
    setPasswordError("");
    if (!client) return;
    if (newPassword.length < 8) { setPasswordError("Choose a password with at least 8 characters."); return; }
    if (newPassword !== confirmPassword) { setPasswordError("The passwords do not match."); return; }
    setPasswordSaving(true);
    const { error } = await client.auth.updateUser({ password: newPassword });
    setPasswordSaving(false);
    if (error) { setPasswordError(error.message); return; }
    setNewPassword(""); setConfirmPassword(""); setPasswordPanel(false);
  }

  async function handleDrop(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault(); setDragActive(false);
    const selected = await filesFromDrop(event.dataTransfer);
    addFiles(selected);
  }

  function addFiles(incoming: SelectedFile[]) {
    setPublishError("");
    setFiles((current) => {
      const paths = new Set(current.map((item) => item.path));
      return [...current, ...incoming.filter((item) => !paths.has(item.path))];
    });
  }

  async function publish() {
    if (!client) return;
    setPublishError("");
    if (!title.trim() || !slug.match(/^[a-z0-9-]+$/) || !version.match(/^v[0-9]+(?:\.[0-9]+){0,2}$/) || !changeSummary.trim() || !authors.length || !files.length) {
      setPublishError("Complete the required details, select an author, and add at least one file."); return;
    }
    setPublishing(true); setProgress(0); setPublishedUrl("");
    try {
      const token = await getToken(client);
      const form = new FormData();
      const metadata = { title: title.trim(), slug, type, version, publishedDate, authors, changeSummary: changeSummary.trim(), commitUrl, deploymentUrl, idempotencyKey: crypto.randomUUID(), paths: files.map((item) => item.path) };
      form.append("metadata", JSON.stringify(metadata));
      files.forEach((item) => form.append("files", item.file, item.file.name));
      const result = await upload(form, token, setProgress);
      if (!result.ok) throw new Error(result.error ?? "Publication failed.");
      setPublishedUrl(result.url ?? "");
      setPreview(false);
    } catch (error) { setPublishError(error instanceof Error ? error.message : "Publication failed."); }
    finally { setPublishing(false); }
  }

  if (!config) return <div className="admin-loading"><LoaderCircle className="spin" /><span>Preparing secure workspace</span></div>;

  if (!config.configured) return (
    <div className="admin-auth-card">
      <div className="auth-icon"><KeyRound /></div><p className="kicker">Configuration required</p><h1>Connect secure sign-in.</h1>
      <p>The public site is ready. Add the Supabase URL and publishable key in the hosted environment to activate access for the five approved accounts.</p>
      <div className="config-keys"><code>NEXT_PUBLIC_SUPABASE_URL</code><code>NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY</code></div>
      <Link className="button button-primary" href="/">Return to public site <ArrowRight size={16} /></Link>
    </div>
  );

  if (!sessionEmail) return (
    <div className="admin-auth-card">
      <div className="auth-icon"><KeyRound /></div><p className="kicker">Publisher portal</p><h1>Sign in to publish.</h1>
      <p>Sign in with Google or use your approved Thapar email and personal password. The public site stays open for everyone else.</p>
      <div className="login-form"><button type="button" className="button button-primary" onClick={signInWithGoogle} disabled={loginState === "signing-in"}>{loginState === "signing-in" ? <LoaderCircle className="spin" /> : <ShieldCheck size={17} />} Continue with Google</button></div>
      <form className="login-form" onSubmit={signIn}><label>Thapar email address<input type="email" value={loginEmail} onChange={(event) => setLoginEmail(event.target.value)} placeholder="name@thapar.edu" required /></label><label>Password<input type="password" value={loginPassword} onChange={(event) => setLoginPassword(event.target.value)} autoComplete="current-password" required /></label><button className="button button-primary" disabled={loginState === "signing-in"}>{loginState === "signing-in" ? <LoaderCircle className="spin" /> : <KeyRound size={17} />} Sign in with password</button></form>
      {loginError && <p className="form-error">{loginError}</p>}
      <p className="auth-footnote"><ShieldCheck size={15} /> Your Google account must use one of the five approved Thapar email addresses.</p>
    </div>
  );

  if (!approved) return <div className="admin-auth-card"><div className="auth-icon danger"><X /></div><p className="kicker">Access denied</p><h1>This account is not approved.</h1><p>Signed in as {sessionEmail}. Only the four team members and instructor may publish.</p><button className="button button-primary" onClick={() => client?.auth.signOut()}>Sign out</button></div>;

  return (
    <div className="admin-workspace">
      <aside className="admin-sidebar">
        <Link className="brand" href="/"><span className="brand-mark"><ShieldCheck size={19} /></span><span>AgentShield</span></Link>
        <div className="admin-nav"><span className="active"><FilePlus2 /> New publication</span><span><FolderOpen /> Version archive</span><span><ShieldCheck /> Activity log</span></div>
        <div className="signed-in"><span>{sessionEmail === "ssingh1_phd23@thapar.edu" ? "Admin" : "Publisher"}</span><strong>{sessionEmail}</strong><button onClick={() => setPasswordPanel(true)}><KeyRound size={15} /> Set password</button><button onClick={() => client?.auth.signOut()}><LogOut size={15} /> Sign out</button></div>
      </aside>
      <main className="admin-main">
        <div className="admin-title"><div><p className="kicker">New publication</p><h1>Publish the next chapter.</h1><p>Create an immutable page for a presentation, report or project milestone.</p></div><div className="draft-state"><span /> Private draft</div></div>
        <div className="admin-grid">
          <div className="publish-form">
            <section className="form-section"><div className="form-section-title"><span>01</span><div><h2>Add files or a folder</h2><p>PDF, presentation, document, image or archive · 50 MB per file</p></div></div>
              <div className={`drop-zone ${dragActive ? "active" : ""}`} onDragEnter={(event) => { event.preventDefault(); setDragActive(true); }} onDragOver={(event) => event.preventDefault()} onDragLeave={() => setDragActive(false)} onDrop={handleDrop}>
                <UploadCloud /><h3>Drop a file or folder here</h3><p>Your folder structure will be preserved in this version.</p><div className="drop-actions"><button onClick={() => fileInput.current?.click()}>Choose files</button><button onClick={() => folderInput.current?.click()}>Choose folder</button></div>
                <input ref={fileInput} type="file" multiple hidden onChange={(event) => addFiles(Array.from(event.target.files ?? []).map((file) => ({ file, path: file.name })))} />
                <input ref={folderInput} type="file" multiple hidden {...({ webkitdirectory: "", directory: "" } as React.InputHTMLAttributes<HTMLInputElement>)} onChange={(event) => addFiles(Array.from(event.target.files ?? []).map((file) => ({ file, path: file.webkitRelativePath || file.name })))} />
              </div>
              {files.length > 0 && <div className="selected-files"><div className="file-summary"><span>{files.length} {files.length === 1 ? "file" : "files"}</span><span>{formatBytes(totalSize)}</span><button onClick={() => setFiles([])}>Clear all</button></div>{files.map((item) => <div className="selected-file" key={item.path}><File size={16} /><div><strong>{item.path}</strong><span>{formatBytes(item.file.size)}</span></div><button onClick={() => setFiles((current) => current.filter((file) => file.path !== item.path))} aria-label={`Remove ${item.path}`}><X size={15} /></button></div>)}</div>}
            </section>
            <section className="form-section"><div className="form-section-title"><span>02</span><div><h2>Describe this version</h2><p>This information becomes the permanent publication record.</p></div></div>
              <div className="field-grid"><label className="span-2">Title *<input value={title} onChange={(event) => { setTitle(event.target.value); if (!slug) setSlug(toSlug(event.target.value)); }} placeholder="Mid-semester architecture presentation" /></label><label>Deliverable type *<select value={type} onChange={(event) => setType(event.target.value)}>{deliverableTypes.map((item) => <option key={item}>{item}</option>)}</select></label><label>Version *<input value={version} onChange={(event) => setVersion(event.target.value)} placeholder="v2" /></label><label>Publication date *<input type="date" value={publishedDate} onChange={(event) => setPublishedDate(event.target.value)} /></label><label>Permanent slug *<input value={slug} onChange={(event) => setSlug(toSlug(event.target.value))} placeholder="mid-sem-architecture" /></label><label className="span-2">Change summary *<textarea value={changeSummary} onChange={(event) => setChangeSummary(event.target.value)} placeholder="Explain what this version adds or changes…" rows={4} /></label><label>Related commit<input type="url" value={commitUrl} onChange={(event) => setCommitUrl(event.target.value)} placeholder="https://github.com/…" /></label><label>Related deployment<input type="url" value={deploymentUrl} onChange={(event) => setDeploymentUrl(event.target.value)} placeholder="https://…" /></label></div>
              <fieldset className="author-picker"><legend>Authors *</legend>{members.map((member) => <label key={member.email}><input type="checkbox" checked={authors.includes(member.name)} onChange={() => setAuthors((current) => current.includes(member.name) ? current.filter((name) => name !== member.name) : [...current, member.name])} /><span>{member.initials}</span>{member.name}</label>)}</fieldset>
            </section>
            {progress > 0 && publishing && <div className="progress-wrap"><div><span>Publishing files…</span><strong>{progress}%</strong></div><div className="progress-track"><span style={{ width: `${progress}%` }} /></div></div>}
            {publishError && <p className="form-error">{publishError}</p>}
            {publishedUrl && <div className="success-note"><Check /> Published successfully. <a href={publishedUrl}>Open the permanent page <ChevronRight size={14} /></a></div>}
            <div className="publish-actions"><button className="button button-ghost" onClick={() => setPreview(true)}>Preview page</button><button className="button button-primary" onClick={publish} disabled={publishing}>{publishing ? <LoaderCircle className="spin" /> : <UploadCloud size={17} />} Publish version</button></div>
          </div>
          <aside className="activity-panel"><p className="kicker">Recent activity</p><h2>Publication trail</h2>{activity.length ? activity.map((item) => <div className="activity-item" key={`${item.created_at}-${item.actor_email}`}><span className="activity-dot" /><div><strong>{item.metadata.title ?? item.action} {item.metadata.version}</strong><p>{item.actor_email}</p><small>{formatDateTime(item.created_at)} · {item.metadata.files ?? 0} files</small></div></div>) : <div className="empty-activity"><ShieldCheck /><p>Your first published version will appear here with its author, time and file count.</p></div>}</aside>
        </div>
      </main>
      {preview && <div className="preview-overlay" role="dialog" aria-modal="true" aria-label="Publication preview"><div className="preview-modal"><button className="modal-close" onClick={() => setPreview(false)} aria-label="Close preview"><X /></button><p className="kicker">Public page preview</p><div className="deliverable-tags"><span>{type}</span><span>{version}</span><span>Permanent record</span></div><h1>{title || "Untitled publication"}</h1><p className="document-summary">{changeSummary || "Add a concise change summary to explain this version."}</p><div className="preview-record"><span>Publication date<strong>{publishedDate}</strong></span><span>Authors<strong>{authors.join(", ") || "No author selected"}</strong></span><span>Files<strong>{files.length} · {formatBytes(totalSize)}</strong></span></div><div className="asset-list">{files.slice(0, 4).map((item) => <div className="asset-row" key={item.path}><div className="document-icon"><File /></div><div><strong>{item.path}</strong><span>{formatBytes(item.file.size)}</span></div></div>)}</div><button className="button button-primary" onClick={() => setPreview(false)}>Continue editing</button></div></div>}
      {passwordPanel && <div className="preview-overlay" role="dialog" aria-modal="true" aria-label="Set password"><form className="preview-modal login-form" onSubmit={savePassword}><button className="modal-close" type="button" onClick={() => setPasswordPanel(false)} aria-label="Close password settings"><X /></button><p className="kicker">Account security</p><h1>Set your password.</h1><p className="document-summary">Choose a personal password for future Publisher Portal sign-ins.</p><label>New password<input type="password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} autoComplete="new-password" minLength={8} required /></label><label>Confirm password<input type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} autoComplete="new-password" minLength={8} required /></label>{passwordError && <p className="form-error">{passwordError}</p>}<button className="button button-primary" disabled={passwordSaving}>{passwordSaving ? <LoaderCircle className="spin" /> : <KeyRound size={17} />} Save password</button></form></div>}
    </div>
  );
}

async function getToken(client: SupabaseClient) { const { data } = await client.auth.getSession(); if (!data.session?.access_token) throw new Error("Your session has expired. Sign in again."); return data.session.access_token; }
function upload(form: FormData, token: string, onProgress: (value: number) => void): Promise<{ ok: boolean; url?: string; error?: string }> { return new Promise((resolve, reject) => { const xhr = new XMLHttpRequest(); xhr.open("POST", "/api/admin/publish"); xhr.setRequestHeader("Authorization", `Bearer ${token}`); xhr.upload.onprogress = (event) => { if (event.lengthComputable) onProgress(Math.round((event.loaded / event.total) * 100)); }; xhr.onload = () => { try { resolve(JSON.parse(xhr.responseText)); } catch { reject(new Error("The server returned an invalid response.")); } }; xhr.onerror = () => reject(new Error("The upload was interrupted. Your draft has not been published.")); xhr.send(form); }); }
function toSlug(value: string) { return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""); }
function formatBytes(size: number) { if (!size) return "0 KB"; return size < 1024 * 1024 ? `${Math.ceil(size / 1024)} KB` : `${(size / 1024 / 1024).toFixed(1)} MB`; }
function formatDateTime(value: string) { return new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }).format(new Date(value)); }

type FileEntry = { isFile: true; file(callback: (file: File) => void): void; name: string; fullPath: string };
type DirectoryEntry = { isFile: false; name: string; fullPath: string; createReader(): { readEntries(callback: (entries: Array<FileEntry | DirectoryEntry>) => void): void } };
async function filesFromDrop(dataTransfer: DataTransfer): Promise<SelectedFile[]> { const entries = Array.from(dataTransfer.items).map((item) => (item as DataTransferItem & { webkitGetAsEntry?: () => FileEntry | DirectoryEntry | null }).webkitGetAsEntry?.()).filter(Boolean) as unknown as Array<FileEntry | DirectoryEntry>; if (!entries.length) return Array.from(dataTransfer.files).map((file) => ({ file, path: file.name })); const nested = await Promise.all(entries.map((entry) => readEntry(entry, ""))); return nested.flat(); }
function readEntry(entry: FileEntry | DirectoryEntry, parent: string): Promise<SelectedFile[]> { if (entry.isFile) return new Promise((resolve) => entry.file((file) => resolve([{ file, path: `${parent}${file.name}` }]))); return new Promise((resolve) => { const reader = entry.createReader(); const all: Array<FileEntry | DirectoryEntry> = []; const read = () => reader.readEntries(async (batch) => { if (!batch.length) { resolve((await Promise.all(all.map((child) => readEntry(child, `${parent}${entry.name}/`)))).flat()); return; } all.push(...batch); read(); }); read(); }); }
