import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getPost } from "@/services/blockidApi";
import PostDetailPanel from "@/components/PostDetailPanel";
import DashboardLayout from "@/components/DashboardLayout";

export default function PostDetail() {
  const { postId } = useParams<{ postId: string }>();
  const navigate = useNavigate();
  const [post, setPost] = useState<any>(null);
  const [replies, setReplies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!postId) return;
    getPost(Number(postId))
      .then((data) => {
        setPost(data.post ?? data);
        setReplies(data.replies ?? []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [postId]);

  if (loading) {
    return (
      <DashboardLayout>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            height: "60vh",
            color: "#666",
            fontSize: 14,
          }}
        >
          Loading post...
        </div>
      </DashboardLayout>
    );
  }

  if (!post) {
    return (
      <DashboardLayout>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            height: "60vh",
            gap: 12,
          }}
        >
          <p style={{ color: "#666", fontSize: 14 }}>Post not found.</p>
          <button
            type="button"
            onClick={() => navigate("/")}
            style={{
              padding: "8px 20px",
              borderRadius: 20,
              background: "#6366f1",
              border: "none",
              color: "#fff",
              fontSize: 13,
              cursor: "pointer",
            }}
          >
            Go Home
          </button>
        </div>
      </DashboardLayout>
    );
  }

  const imgUrl = post.original_post?.image_url ?? post.image_url;

  return (
    <DashboardLayout>
      <div
        style={{
          maxWidth: imgUrl ? 900 : 600,
          width: "100%",
          height: "80vh",
          margin: "40px auto",
          display: "flex",
        }}
      >
        <PostDetailPanel
          post={post}
          replies={replies}
          onClose={() => navigate(-1)}
          onRepliesChange={setReplies}
        />
      </div>
    </DashboardLayout>
  );
}
