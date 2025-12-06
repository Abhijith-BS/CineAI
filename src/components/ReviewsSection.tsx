import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";
import { useAuthActions } from "@convex-dev/auth/react";

interface ReviewsSectionProps {
    contentType: "movie" | "tv";
    contentId: number;
}

export function ReviewsSection({ contentType, contentId }: ReviewsSectionProps) {
    const reviews = useQuery(api.reviews.list, { contentType, contentId });
    const user = useQuery(api.auth.loggedInUser);
    const createReview = useMutation(api.reviews.create);
    const editReview = useMutation(api.reviews.edit);
    const deleteReview = useMutation(api.reviews.deleteReview);

    const [newReviewContent, setNewReviewContent] = useState("");
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editContent, setEditContent] = useState("");

    const getInitials = (name: string | undefined | null) => {
        if (!name) return "?";
        const parts = name.trim().split(" ");
        if (parts.length > 1) {
            return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
        }
        return name.charAt(0).toUpperCase();
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newReviewContent.trim()) return;

        try {
            await createReview({
                contentType,
                contentId,
                content: newReviewContent,
            });
            setNewReviewContent("");
            toast.success("Review posted!");
        } catch (error) {
            toast.error("Failed to post review. Please try again.");
            console.error(error);
        }
    };

    const handleEdit = async (reviewId: any) => {
        try {
            await editReview({ reviewId, content: editContent });
            setEditingId(null);
            toast.success("Review updated!");
        } catch (error) {
            toast.error("Failed to update review.");
        }
    };

    const handleDelete = async (reviewId: any) => {
        if (!confirm("Are you sure you want to delete this review?")) return;
        try {
            await deleteReview({ reviewId });
            toast.success("Review deleted.");
        } catch (error) {
            toast.error("Failed to delete review.");
        }
    };

    if (reviews === undefined) {
        return <div className="text-gray-400 py-4">Loading reviews...</div>;
    }

    return (
        <div className="mt-8">
            <h3 className="text-2xl font-bold text-white mb-6">Reviews & Comments</h3>

            {/* Write Review */}
            {user ? (
                <form onSubmit={handleSubmit} className="mb-8 bg-white/5 p-4 rounded-xl border border-white/10">
                    <div className="flex gap-4">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                            {getInitials(user.name || user.email || "U")}
                        </div>
                        <div className="flex-grow">
                            <textarea
                                className="w-full bg-transparent text-white placeholder-gray-500 focus:outline-none resize-none"
                                placeholder="Write a review..."
                                rows={3}
                                value={newReviewContent}
                                onChange={(e) => setNewReviewContent(e.target.value)}
                                required
                            />
                            <div className="flex justify-end mt-2">
                                <button
                                    type="submit"
                                    disabled={!newReviewContent.trim()}
                                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium text-sm"
                                >
                                    Post Review
                                </button>
                            </div>
                        </div>
                    </div>
                </form>
            ) : (
                <div className="mb-8 p-4 bg-white/5 rounded-xl border border-white/10 text-center text-gray-400">
                    Please <span className="text-purple-400 font-medium">sign in</span> to leave a review.
                </div>
            )}

            {/* Reviews List */}
            <div className="space-y-4">
                {reviews.length === 0 ? (
                    <p className="text-gray-500 italic">No reviews yet. Be the first to share your thoughts!</p>
                ) : (
                    reviews.map((review: any) => (
                        <div key={review._id} className="bg-black/20 p-4 rounded-xl border border-white/5">
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-gray-300 font-bold text-sm">
                                        {getInitials(review.userName)}
                                    </div>
                                    <div>
                                        <div className="font-semibold text-white text-sm">
                                            {review.userName}
                                            {/* Add (You) label if it's the current user */}
                                            {user && review.userId === user._id && <span className="ml-2 text-xs text-purple-400 bg-purple-400/10 px-1.5 py-0.5 rounded">You</span>}
                                        </div>
                                        <div className="text-xs text-gray-500">
                                            {new Date(review.timestamp).toLocaleDateString()}
                                            {review.edited && <span className="ml-1 text-gray-600">(edited)</span>}
                                        </div>
                                    </div>
                                </div>

                                {/* Actions for owner */}
                                {user && review.userId === user._id && editingId !== review._id && (
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => {
                                                setEditingId(review._id);
                                                setEditContent(review.content);
                                            }}
                                            className="text-xs text-gray-500 hover:text-white transition-colors"
                                        >
                                            Edit
                                        </button>
                                        <button
                                            onClick={() => handleDelete(review._id)}
                                            className="text-xs text-gray-500 hover:text-red-400 transition-colors"
                                        >
                                            Delete
                                        </button>
                                    </div>
                                )}
                            </div>

                            {editingId === review._id ? (
                                <div className="mt-2">
                                    <textarea
                                        className="w-full bg-white/5 rounded p-2 text-white border border-white/10 focus:outline-none focus:border-purple-500 mb-2"
                                        value={editContent}
                                        onChange={(e) => setEditContent(e.target.value)}
                                        rows={3}
                                    />
                                    <div className="flex justify-end gap-2">
                                        <button
                                            onClick={() => setEditingId(null)}
                                            className="text-xs px-3 py-1 text-gray-400 hover:text-white"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={() => handleEdit(review._id)}
                                            className="text-xs px-3 py-1 bg-purple-600 text-white rounded hover:bg-purple-700"
                                        >
                                            Save
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <p className="text-gray-300 text-sm whitespace-pre-wrap pl-11">{review.content}</p>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
