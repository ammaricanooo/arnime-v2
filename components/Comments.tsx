"use client";

import { useEffect, useState } from "react";

type Comment = {
  _id: string;
  name: string;
  text: string;
  parentId: string | null;
};

export default function Page() {
  const [name, setName] = useState("");
  const [text, setText] = useState("");
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);

  const loadComments = async () => {
    const res = await fetch("/api/comments");
    const data = await res.json();
    setComments(data);
  };

  useEffect(() => {
    loadComments();
  }, []);

  const sendComment = async () => {
    if (!text.trim()) return;

    await fetch("/api/comments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        text,
        parentId: replyTo,
      }),
    });

    setText("");
    setReplyTo(null);
    loadComments();
  };

  const renderReplies = (parentId: string) =>
    comments
      .filter((c) => c.parentId === parentId)
      .map((reply) => (
        <div key={reply._id} style={{ marginLeft: 24 }}>
          <strong>{reply.name}</strong>
          <p>{reply.text}</p>
        </div>
      ));

  return (
    <main style={{ maxWidth: 600, margin: "40px auto" }}>
      <h2>Comment Section</h2>

      {replyTo && (
        <p style={{ color: "gray" }}>
          Membalas komentar…{" "}
          <button onClick={() => setReplyTo(null)}>batal</button>
        </p>
      )}

      <input
        placeholder="Nama (optional)"
        value={name}
        onChange={(e) => setName(e.target.value)}
        style={{ width: "100%", marginBottom: 8 }}
      />

      <textarea
        placeholder="Tulis komentar..."
        value={text}
        onChange={(e) => setText(e.target.value)}
        style={{ width: "100%", marginBottom: 8 }}
      />

      <button onClick={sendComment}>
        {replyTo ? "Kirim Balasan" : "Kirim Komentar"}
      </button>

      <hr />

      {comments
        .filter((c) => c.parentId === null)
        .map((comment) => (
          <div key={comment._id} style={{ marginBottom: 16 }}>
            <strong>{comment.name}</strong>
            <p>{comment.text}</p>

            <button onClick={() => setReplyTo(comment._id)}>
              Balas
            </button>

            {renderReplies(comment._id)}
          </div>
        ))}
    </main>
  );
}
