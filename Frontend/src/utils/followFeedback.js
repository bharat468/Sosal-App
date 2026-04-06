import toast from "react-hot-toast";

const messageByStatus = {
  followed: "Followed successfully",
  unfollowed: "Unfollowed successfully",
  requested: "Follow request sent",
  request_cancelled: "Follow request cancelled",
};

export function showFollowToast(status) {
  toast.success(messageByStatus[status] || "Follow status updated");
}

export function showFollowErrorToast(message) {
  toast.error(message || "Unable to update follow status");
}
