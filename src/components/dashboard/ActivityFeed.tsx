import { FiExternalLink, FiCheck, FiX, FiClock } from "react-icons/fi";
import { FaXTwitter, FaFacebook, FaInstagram } from "react-icons/fa6";
import type { PostLog, Platform } from "../../types/agent";

interface Props {
  posts: PostLog[];
}

const platformIcon = (p: Platform) => {
  switch (p) {
    case "twitter": return <FaXTwitter />;
    case "facebook": return <FaFacebook />;
    case "instagram": return <FaInstagram />;
  }
};

const statusIcon = (status: PostLog["status"]) => {
  switch (status) {
    case "posted": return <FiCheck className="status-icon success" />;
    case "failed": return <FiX className="status-icon error" />;
    case "pending": return <FiClock className="status-icon pending" />;
  }
};

function formatTimeAgo(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

export function ActivityFeed({ posts }: Props) {
  return (
    <div className="activity-feed">
      <div className="activity-header">
        <h3>Recent Activity</h3>
        <span className="activity-count">{posts.length} posts</span>
      </div>

      {posts.length === 0 ? (
        <div className="activity-empty">
          <p>No posts yet</p>
          <p className="muted">Your agent's posts will appear here once it starts posting</p>
        </div>
      ) : (
        <div className="activity-list">
          {posts.map((post) => (
            <div key={post.id} className={`activity-item status-${post.status}`}>
              <div className="activity-item-header">
                <div className="activity-meta">
                  <span className="activity-platform">{platformIcon(post.platform)}</span>
                  {statusIcon(post.status)}
                  <span className="activity-type">{post.postType}</span>
                  <span className="activity-time">{formatTimeAgo(post.createdAt)}</span>
                </div>
                {post.postUrl && (
                  <a
                    href={post.postUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="activity-link"
                  >
                    <FiExternalLink />
                  </a>
                )}
              </div>

              <div className="activity-content">
                <p>{post.content}</p>
              </div>

              {post.engagement && (
                <div className="activity-engagement">
                  <span>{post.engagement.likes} likes</span>
                  <span>{post.engagement.comments} comments</span>
                  <span>{post.engagement.shares} shares</span>
                </div>
              )}

              {post.error && (
                <div className="activity-error">
                  {post.error}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
