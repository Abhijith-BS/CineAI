import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { toast } from "sonner";
import gsap from "gsap";
import { SignInModal } from "../SignInModal";

interface MovieNightLobbyProps {
    onJoinRoom: (roomId: any) => void;
    onSignIn: () => void;
}

export function MovieNightLobby({ onJoinRoom, onSignIn }: MovieNightLobbyProps) {
    const createRoom = useMutation(api.rooms.createRoom);
    const joinRoom = useMutation(api.rooms.joinRoom);

    const [roomCode, setRoomCode] = useState("");
    const [isJoining, setIsJoining] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [showAuthModal, setShowAuthModal] = useState(false);

    const handleCreateRoom = async () => {
        setIsCreating(true);
        try {
            const result = await createRoom({});
            toast.success(`Room created! Code: ${result.code}`);
            onJoinRoom(result.roomId);
        } catch (error: any) {
            console.error(error);
            const msg = error instanceof Error ? error.message : (error.toString() || "Failed to create room");

            if (msg.includes("Anonymous") || msg.includes("Sign in")) {
                toast.error("Please sign in to create a room");
                setShowAuthModal(true);
            } else {
                toast.error(msg); // Show actual error to help debugging
            }
        } finally {
            setIsCreating(false);
        }
    };

    const handleJoinRoom = async (e: React.FormEvent) => {
        e.preventDefault();
        if (roomCode.length !== 4) {
            toast.error("Code must be 4 characters");
            return;
        }

        setIsJoining(true);
        try {
            const result = await joinRoom({ code: roomCode });
            toast.success("Joined room!");
            onJoinRoom(result.roomId);
        } catch (error: any) {
            console.error(error);
            const msg = error instanceof Error ? error.message : (error.toString() || "Failed to join room");

            if (msg.includes("Anonymous") || msg.includes("Sign in")) {
                toast.error("Please sign in to join a room");
                setShowAuthModal(true);
            } else {
                toast.error(msg);
            }
        } finally {
            setIsJoining(false);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-8 p-6">
            <SignInModal
                isOpen={showAuthModal}
                onClose={() => setShowAuthModal(false)}
                onSignIn={() => {
                    setShowAuthModal(false);
                    onSignIn();
                }}
                title="Sign in to use Movie Night"
                description="Create an account or sign in to host or join movie matching rooms completely for free."
            />
            <div className="space-y-4">
                <h1 className="text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-600">
                    Movie Night Matcher
                </h1>
                <p className="text-gray-400 text-lg max-w-md mx-auto">
                    Can't decide what to watch? Swipe with friends and find a match!
                </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 w-full max-w-4xl mt-8">
                {/* Create Room */}
                <div
                    className="bg-white/5 border border-white/10 rounded-2xl p-8 hover:bg-white/10 transition-all duration-300 cursor-pointer group"
                    onClick={handleCreateRoom}
                >
                    <div className="w-16 h-16 bg-purple-600/20 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                        <svg className="w-8 h-8 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-2">Create a Room</h2>
                    <p className="text-gray-400">Start a new session and invite your friends given a unique code.</p>
                    <button
                        disabled={isCreating}
                        className="mt-6 px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-full font-semibold transition-colors disabled:opacity-50"
                    >
                        {isCreating ? "Creating..." : "Start Hosting"}
                    </button>
                </div>

                {/* Join Room */}
                <div className="bg-white/5 border border-white/10 rounded-2xl p-8 hover:bg-white/10 transition-all duration-300">
                    <div className="w-16 h-16 bg-pink-600/20 rounded-full flex items-center justify-center mx-auto mb-6">
                        <svg className="w-8 h-8 text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                        </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-2">Join a Room</h2>
                    <p className="text-gray-400 mb-6">Enter the 4-character code shared by the host.</p>
                    <form onSubmit={handleJoinRoom} className="flex flex-col space-y-4">
                        <input
                            type="text"
                            value={roomCode}
                            onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                            maxLength={4}
                            placeholder="ABCD"
                            className="bg-black/40 border border-white/20 rounded-lg px-4 py-3 text-center text-2xl font-mono tracking-widest text-white focus:outline-none focus:border-pink-500 transition-colors uppercase"
                        />
                        <button
                            type="submit"
                            disabled={isJoining || roomCode.length !== 4}
                            className="px-6 py-2 bg-pink-600 hover:bg-pink-700 text-white rounded-full font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isJoining ? "Joining..." : "Join Room"}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
