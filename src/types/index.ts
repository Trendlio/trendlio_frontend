export interface User {
  id: number;
  username: string;
  fullName: string | null;
  email?: string;
  profilePicUrl?: string | null;
  isVerified: boolean;
  followerCount?: number;
  followingCount?: number;
  active?: boolean;
  roles?: UserRole[];
  accountType?: number;
  biography?: string;
  category?: string;
  createdAt?: string;
  externalUrl?: string;
  hasOnboardedToTextPostApp?: boolean;
  isBusiness?: boolean;
  mediaCount?: number;
  privateAccount?: boolean;
  showTextPostAppBadge?: boolean;
  textPostAppJoinerNumber?: number;
  updatedAt?: string;
  verifiedAccount?: boolean;
  isFollowing?: boolean;
  bio?: string;
}

export interface UserRole {
  role: string;
}

export interface VerificationToken {
  id: number;
  token: string;
  user: User;
  type: "EMAIL_VERIFICATION" | "PASSWORD_RESET";
  expiryDate: string;
  createdAt: string;
}

export interface Post {
  id: number;
  user: User;
  caption: string;
  mediaType: number;
  code: string;
  takenAt: string;
  likeCount: number;
  commentCount: number;
  repostCount: number;
  shareCount: number;
  hasLiked: boolean;
  media: Media[];
  textPostInfo: any | null;
  mediaUrls?: string[];
  mediaDimensions?: {
    width: number;
    height: number;
    duration?: number;
  }[];
  comment?: Comment;
  comments?: Comment[];
}

export interface Media {
  id: number;
  mediaType: number;
  url: string;
  width: number;
  height: number;
  videoDuration?: number;
  thumbnailUrl?: string;
  hasAudio?: boolean;
  isDashEligible?: boolean;
  position: number;
  postId: number;
  videoCodec?: string;
  videoDashManifest?: string;
}

export interface TextPostInfo {
  isReply: boolean;
  replyToPostId?: string;
  replyToUserId?: string;
  directReplyCount: number;
  threadId: string;
  replyToUser?: User;
}

export interface Comment {
  id: number;
  postId: string;
  userId: string;
  text: string;
  likeCount: number;
  replyCount: number;
  isEdited: boolean;
  isHidden: boolean;
  mentions?: string[];
  hashtags?: string[];
  depth: number;
  createdAt: string;
  updatedAt: string;
  user: User;
  hasLiked: boolean;
  repostCount: number;
  shareCount: number;
  replies?: Comment[];
}

export interface Hashtag {
  id: number;
  name: string;
  postCount: number;
  createdAt: string;
}

export interface Notification {
  id: number;
  actor: User;
  notificationType: string;
  post?: Post;
  comment?: Comment;
  isRead: boolean;
  createdAt: string;
}

export interface PaginatedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}
