import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import Navbar from "../Navbar";
import API from "../../api/axios";
import "./fileViewer.css";

const FileViewer = () => {
  const { id } = useParams();
  const [params] = useSearchParams();
  const navigate = useNavigate();

  const filePath = params.get("path");

  const [repo, setRepo] = useState(null);
  const [file, setFile] = useState(null);
  const [text, setText] = useState("");
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [loading, setLoading] = useState(true);

  const userId = localStorage.getItem("userId");

  const isOwner = useMemo(() => {
    return repo?.owner?._id === userId;
  }, [repo, userId]);

  const fetchAll = async () => {
    try {
      setLoading(true);

      const repoRes = await API.get(`/repo/${id}`);
      setRepo(repoRes.data);

      const fileRes = await API.get(`/repo/${id}/file`, {
        params: { path: filePath },
      });

      setFile(fileRes.data);
      setText(fileRes.data.content);
    } catch (err) {
      console.error("FILE VIEW ERROR:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!filePath) return;
    fetchAll();
  }, [id, filePath]);

  const saveFile = async () => {
    try {
      setSaving(true);

      await API.put(`/repo/${id}/file`, {
        path: filePath,
        content: text,
      });

      setEditing(false);
      await fetchAll();
    } catch (err) {
      console.error("SAVE FILE ERROR:", err);
      alert("Failed to save file");
    } finally {
      setSaving(false);
    }
  };

  const downloadFile = async () => {
    try {
      setDownloading(true);

      const res = await API.get(`/repo/${id}/download`, {
        params: { path: filePath },
        responseType: "blob",
      });

      const blob = new Blob([res.data]);
      const url = window.URL.createObjectURL(blob);

      const fileName = filePath.split("/").pop() || "file";

      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      a.remove();

      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("DOWNLOAD ERROR:", err);
      alert("Download failed");
    } finally {
      setDownloading(false);
    }
  };

  if (!filePath) {
    return (
      <>
        <Navbar />
        <div className="file-wrapper">
          <div className="file-error">No file selected</div>
        </div>
      </>
    );
  }

  if (loading || !repo || !file) return null;

  return (
    <>
      <Navbar />

      <section className="file-wrapper">
        <div className="file-header">
          <div>
            <h2 className="file-title">{repo.name}</h2>
            <p className="file-path">{filePath}</p>
          </div>

          <div className="file-actions">
            <button className="btn ghost" onClick={() => navigate(`/repo/${id}`)}>
              Back to repo
            </button>

            <button
              className="btn ghost"
              onClick={downloadFile}
              disabled={downloading}
            >
              {downloading ? "Downloading…" : "Download"}
            </button>

            {isOwner && (
              <>
                {!editing ? (
                  <button className="btn ghost" onClick={() => setEditing(true)}>
                    Edit file
                  </button>
                ) : (
                  <>
                    <button
                      className="btn ghost"
                      onClick={() => setEditing(false)}
                    >
                      Cancel
                    </button>

                    <button
                      className="btn primary"
                      onClick={saveFile}
                      disabled={saving}
                    >
                      {saving ? "Saving…" : "Save"}
                    </button>
                  </>
                )}
              </>
            )}
          </div>
        </div>

        <div className="file-card">
          {!editing ? (
            <pre className="file-content">{file.content}</pre>
          ) : (
            <textarea
              className="file-editor"
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
          )}
        </div>
      </section>
    </>
  );
};

export default FileViewer;