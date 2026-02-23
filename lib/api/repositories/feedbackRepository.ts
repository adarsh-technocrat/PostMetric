import { apiClient } from "@/lib/api/client";

export interface FeedbackPost {
  _id: string;
  [key: string]: unknown;
}

export async function getFeedbackPosts(sort?: string): Promise<FeedbackPost[]> {
  const url = sort ? `/api/feedback/posts?sort=${sort}` : "/api/feedback/posts";
  const { data } = await apiClient.get<{ posts: FeedbackPost[] }>(url);
  return data.posts ?? [];
}

export async function getFeedbackPost(postId: string): Promise<FeedbackPost> {
  const { data } = await apiClient.get<{ post: FeedbackPost }>(
    `/api/feedback/posts/${postId}`,
  );
  return data.post;
}

export async function createFeedbackPost(payload: {
  title: string;
  content?: string;
  [key: string]: unknown;
}): Promise<FeedbackPost> {
  const { data } = await apiClient.post<{ post: FeedbackPost }>(
    "/api/feedback/posts",
    payload,
  );
  return data.post;
}

export async function upvoteFeedbackPost(postId: string): Promise<unknown> {
  const { data } = await apiClient.post(`/api/feedback/posts/${postId}/upvote`);
  return data;
}

export interface FeedbackComment {
  _id: string;
  [key: string]: unknown;
}

export async function getFeedbackComments(
  postId: string,
): Promise<FeedbackComment[]> {
  const { data } = await apiClient.get<{ comments: FeedbackComment[] }>(
    `/api/feedback/posts/${postId}/comments`,
  );
  return data.comments ?? [];
}

export async function createFeedbackComment(
  postId: string,
  payload: { content: string; [key: string]: unknown },
): Promise<FeedbackComment> {
  const { data } = await apiClient.post<{ comment: FeedbackComment }>(
    `/api/feedback/posts/${postId}/comments`,
    payload,
  );
  return data.comment;
}

export async function upvoteFeedbackComment(
  postId: string,
  commentId: string,
): Promise<unknown> {
  const { data } = await apiClient.post(
    `/api/feedback/posts/${postId}/comments/${commentId}/upvote`,
  );
  return data;
}

export async function deleteFeedbackComment(
  postId: string,
  commentId: string,
): Promise<void> {
  await apiClient.delete(
    `/api/feedback/posts/${postId}/comments/${commentId}`,
  );
}
