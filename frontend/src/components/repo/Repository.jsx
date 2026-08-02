import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Navbar from "../Navbar";
import API from "../../api/axios";
import EditRepoModal from "./EditRepoModal";
import "./repository.css";

const Repository = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [repo, setRepo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showEdit, setShowEdit] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deletingRepo, setDeletingRepo] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState("");

  // AI Features State in Repo View
  const [searchQuery, setSearchQuery] = useState("");
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchResults, setSearchResults] = useState(null);
  const [showSearchModal, setShowSearchModal] = useState(false);

  const [readmeLoading, setReadmeLoading] = useState(false);
  const [generatedReadme, setGeneratedReadme] = useState("");
  const [showReadmeModal, setShowReadmeModal] = useState(false);

  const [openFolders, setOpenFolders] = useState({});

  const fileRef = useRef(null);
  const folderRef = useRef(null);

  const userId = localStorage.getItem("userId");
  const isOwner = repo?.owner?._id === userId;

  const fetchRepo = async () => {
    try {
      setError("");
      const { data } = await API.get(`/repo/${id}`);
      setRepo(data);
    } catch (err) {
      console.error("Failed to load repository", err);
      setError("Failed to load repository");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRepo();
  }, [id]);

  // AI Feature 3: Natural Language Code Search
  const handleAiSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    try {
      setSearchLoading(true);
      setShowSearchModal(true);
      const { data } = await API.post(`/ai/search/${id}`, {
        query: searchQuery,
      });
      setSearchResults(data);
    } catch (err) {
      console.error("AI Search Error:", err);
    } finally {
      setSearchLoading(false);
    }
  };

  // AI Feature 4: Generate README
  const handleGenerateReadme = async () => {
    setShowReadmeModal(true);
    try {
      setReadmeLoading(true);
      const { data } = await API.post(`/ai/docs/${id}/readme`);
      setGeneratedReadme(data.readme);
    } catch (err) {
      console.error("Readme Gen Error:", err);
    } finally {
      setReadmeLoading(false);
    }
  };

  const uploadToRepo = async (files, isFolder) => {
    if (!files || !files.length) return;

    const formData = new FormData();

    files.forEach((file) => {
      if (isFolder) {
        formData.append("files", file);
        formData.append("paths", file.webkitRelativePath);
      } else {
        formData.append("files", file);
        formData.append("paths", file.name);
      }
    });

    try {
      setUploading(true);

      const { data } = await API.post(`/repo/${id}/upload`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setRepo((prev) => ({
        ...prev,
        content: data.content,
      }));
    } catch (err) {
      console.error("Upload failed", err);
      setError("Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleUploadFiles = async (e) => {
    const files = Array.from(e.target.files || []);
    await uploadToRepo(files, false);
    e.target.value = "";
  };

  const handleUploadFolder = async (e) => {
    const files = Array.from(e.target.files || []);
    await uploadToRepo(files, true);
    e.target.value = "";
  };

  const openFilePicker = () => fileRef.current?.click();
  const openFolderPicker = () => folderRef.current?.click();

  const deleteRepo = async () => {
    if (!isOwner) return;

    const ok = window.confirm(`Delete repository permanently?\n\n${repo.name}`);
    if (!ok) return;

    try {
      setDeletingRepo(true);
      await API.delete(`/repo/delete/${id}`);
      navigate("/");
    } catch (err) {
      console.error("Delete repo failed", err);
      setError("Delete repository failed");
    } finally {
      setDeletingRepo(false);
    }
  };

  const deleteFile = async (filePath) => {
    if (!isOwner) return;

    const ok = window.confirm(`Delete file?\n\n${filePath}`);
    if (!ok) return;

    try {
      const { data } = await API.delete(`/repo/${id}/file`, {
        data: { filePath },
      });

      setRepo((prev) => ({
        ...prev,
        content: data.content,
      }));
    } catch (err) {
      console.error("Delete file failed", err);
      setError("Delete file failed");
    }
  };

  const fileTree = useMemo(() => {
    if (!repo?.content || !Array.isArray(repo.content)) return {};

    const tree = {};

    repo.content.forEach((p) => {
      if (!p || typeof p !== "string") return;

      const clean = p.replace(/\\/g, "/");
      const parts = clean.split("/").filter(Boolean);

      let current = tree;

      parts.forEach((part, idx) => {
        const isLast = idx === parts.length - 1;

        if (!current[part]) {
          current[part] = isLast ? null : {};
        }

        current = current[part] || {};
      });
    });

    return tree;
  }, [repo]);

  const toggleFolder = (folderKey) => {
    setOpenFolders((prev) => ({
      ...prev,
      [folderKey]: !prev[folderKey],
    }));
  };

  const renderTree = (node, level = 0, parentPath = "") => {
    const entries = Object.entries(node);

    entries.sort(([aName, aChildren], [bName, bChildren]) => {
      const aIsFile = aChildren === null;
      const bIsFile = bChildren === null;

      if (aIsFile !== bIsFile) return aIsFile ? 1 : -1;
      return aName.localeCompare(bName);
    });

    return entries.map(([name, children]) => {
      const isFile = children === null;
      const currentPath = parentPath ? `${parentPath}/${name}` : name;

      if (isFile) {
        return (
          <div
            key={currentPath}
            className="file-row file"
            style={{ paddingLeft: `${level * 18}px` }}
          >
            <span className="file-icon">📄</span>
            <span
              className="file-name clickable"
              onClick={() =>
                navigate(`/repo/${id}/view?path=${encodeURIComponent(currentPath)}`)
              }
            >
              {name}
            </span>

            {isOwner && (
              <button
                className="file-delete"
                onClick={() => deleteFile(currentPath)}
              >
                Delete
              </button>
            )}
          </div>
        );
      }

      const isOpen = !!openFolders[currentPath];

      return (
        <div key={currentPath}>
          <div
            className="file-row folder"
            style={{ paddingLeft: `${level * 18}px` }}
            onClick={() => toggleFolder(currentPath)}
          >
            <span className="file-icon">{isOpen ? "📂" : "📁"}</span>
            <span className="file-name">{name}</span>
            <span className="folder-arrow">{isOpen ? "▾" : "▸"}</span>
          </div>

          {isOpen && (
            <div className="file-children">
              {renderTree(children, level + 1, currentPath)}
            </div>
          )}
        </div>
      );
    });
  };

  const onDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isOwner) return;
    setDragActive(true);
  };

  const onDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  const onDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isOwner) return;
    setDragActive(true);
  };

  const onDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (!isOwner) return;

    const files = Array.from(e.dataTransfer.files || []);
    if (!files.length) return;

    const hasFolderPaths = files.some((f) => f.webkitRelativePath);
    await uploadToRepo(files, hasFolderPaths);
  };

  if (loading) return null;
  if (error) return <div className="error">{error}</div>;
  if (!repo) return null;

  return (
    <>
      <Navbar />

      <section className="repo-wrapper">
        {/* Top Header */}
        <div className="repo-header">
          <div>
            <h2>{repo.name}</h2>
            <p className="repo-desc">{repo.description || "No description"}</p>
          </div>

          <div className="repo-actions">
            <span className={`badge ${repo.visibility ? "public" : "private"}`}>
              {repo.visibility ? "Public" : "Private"}
            </span>

            {/* AI Generate README button */}
            <button className="btn ai-btn" onClick={handleGenerateReadme}>
              ✨ Gen README
            </button>

            {isOwner && (
              <>
                <button
                  className={`btn ghost upload-btn ${uploading ? "disabled" : ""}`}
                  onClick={openFilePicker}
                  disabled={uploading}
                >
                  {uploading ? "Uploading…" : "Add files"}
                </button>

                <button
                  className={`btn ghost upload-btn ${uploading ? "disabled" : ""}`}
                  onClick={openFolderPicker}
                  disabled={uploading}
                >
                  {uploading ? "Uploading…" : "Upload folder"}
                </button>

                <button
                  className="btn ghost"
                  onClick={() => navigate(`/repo/${id}/issues`)}
                >
                  Issues
                </button>

                <button className="btn ghost" onClick={() => setShowEdit(true)}>
                  Edit Repository
                </button>

                <button
                  className="btn danger"
                  onClick={deleteRepo}
                  disabled={deletingRepo}
                >
                  {deletingRepo ? "Deleting…" : "Delete Repo"}
                </button>

                <input
                  ref={fileRef}
                  type="file"
                  multiple
                  hidden
                  onChange={handleUploadFiles}
                />

                <input
                  ref={folderRef}
                  type="file"
                  multiple
                  hidden
                  onChange={handleUploadFolder}
                  webkitdirectory=""
                  directory=""
                />
              </>
            )}
          </div>
        </div>

        {/* Feature 3: Natural Language Code Search Bar */}
        <form className="ai-search-bar" onSubmit={handleAiSearch}>
          <input
            type="text"
            placeholder="Ask AI about this codebase (e.g. 'Where are database models defined?' or 'How is auth checked?')"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <button type="submit" className="btn ai-btn">
            🔍 AI Search
          </button>
        </form>

        <div className="repo-layout">
          <aside className="panel repo-info">
            <h4>About</h4>
            <p>{repo.description || "No description provided."}</p>

            <div className="repo-stats">
              <span>⭐ {repo.stars}</span>
              <span>📄 {repo.content?.length || 0} files</span>
            </div>
          </aside>

          <main
            className={`panel repo-files ${dragActive ? "drag-active" : ""}`}
            onDragEnter={onDragEnter}
            onDragLeave={onDragLeave}
            onDragOver={onDragOver}
            onDrop={onDrop}
          >
            <h4>Files</h4>

            {isOwner && (
              <div className="drop-hint">Drag & drop files/folders here</div>
            )}

            {!repo.content || repo.content.length === 0 ? (
              <p className="muted">This repository is empty.</p>
            ) : (
              <div className="file-tree">{renderTree(fileTree)}</div>
            )}
          </main>

          <aside className="panel repo-meta">
            <h4>Repository Info</h4>
            <p>Owner: {repo.owner?.username || "unknown"}</p>
            <p>Updated {new Date(repo.updatedAt).toLocaleDateString()}</p>
          </aside>
        </div>
      </section>

      {/* Edit Modal */}
      {showEdit && (
        <EditRepoModal
          repo={repo}
          onClose={() => setShowEdit(false)}
          onUpdated={fetchRepo}
        />
      )}

      {/* AI Search Results Modal */}
      {showSearchModal && (
        <div className="modal-overlay" onClick={() => setShowSearchModal(false)}>
          <div className="modal-box ai-search-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>🔍 AI Codebase Intelligence Search</h3>
              <button className="modal-close" onClick={() => setShowSearchModal(false)}>
                ✕
              </button>
            </div>
            <div className="modal-body">
              {searchLoading ? (
                <div className="ai-loading">
                  <div className="spinner"></div>
                  <p>Searching codebase using Gemini AI…</p>
                </div>
              ) : searchResults ? (
                <>
                  <div className="ai-answer-box">
                    <h4>AI Answer</h4>
                    <p>{searchResults.answer}</p>
                  </div>

                  <h4>Relevant Matches ({searchResults.matches?.length || 0})</h4>
                  {searchResults.matches?.map((m, idx) => (
                    <div key={idx} className="match-card">
                      <div className="match-header">
                        <span
                          className="file-path clickable"
                          onClick={() => {
                            setShowSearchModal(false);
                            navigate(`/repo/${id}/view?path=${encodeURIComponent(m.filePath)}`);
                          }}
                        >
                          📄 {m.filePath}
                        </span>
                        <span className={`relevance ${m.relevance?.toLowerCase()}`}>
                          {m.relevance} Relevance
                        </span>
                      </div>
                      <p className="match-explanation">{m.explanation}</p>
                      {m.snippet && <pre className="snippet-code">{m.snippet}</pre>}
                    </div>
                  ))}
                </>
              ) : null}
            </div>
          </div>
        </div>
      )}

      {/* AI Generate README Modal */}
      {showReadmeModal && (
        <div className="modal-overlay" onClick={() => setShowReadmeModal(false)}>
          <div className="modal-box readme-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>✨ AI Generated README.md</h3>
              <button className="modal-close" onClick={() => setShowReadmeModal(false)}>
                ✕
              </button>
            </div>
            <div className="modal-body">
              {readmeLoading ? (
                <div className="ai-loading">
                  <div className="spinner"></div>
                  <p>Analyzing project structure and writing README.md…</p>
                </div>
              ) : (
                <textarea
                  className="readme-textarea"
                  rows={15}
                  value={generatedReadme}
                  onChange={(e) => setGeneratedReadme(e.target.value)}
                />
              )}
            </div>
            <div className="modal-footer">
              <button className="btn ghost" onClick={() => setShowReadmeModal(false)}>
                Close
              </button>
              <button
                className="btn primary"
                onClick={() => {
                  navigator.clipboard.writeText(generatedReadme);
                  alert("README copied to clipboard!");
                }}
              >
                Copy Markdown
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Repository;