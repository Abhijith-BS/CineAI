import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import gsap from "gsap";

interface SignInModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSignIn: () => void;
    title?: string;
    description?: string;
}

export function SignInModal({ isOpen, onClose, onSignIn, title, description }: SignInModalProps) {
    const modalRef = useRef<HTMLDivElement>(null);
    const overlayRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (isOpen) {
            if (overlayRef.current) {
                gsap.fromTo(overlayRef.current, { opacity: 0 }, { opacity: 1, duration: 0.3 });
            }
            if (modalRef.current) {
                gsap.fromTo(
                    modalRef.current,
                    { scale: 0.8, opacity: 0, y: 20 },
                    { scale: 1, opacity: 1, y: 0, duration: 0.4, ease: "back.out(1.7)" }
                );
            }
        }
    }, [isOpen]);

    if (!isOpen) return null;

    // Use React Portal to render modal outside of parent containers that might have transforms
    // This ensures position: fixed works relative to the viewport
    return createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                ref={overlayRef}
                className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                onClick={onClose}
            ></div>

            {/* Modal */}
            <div
                ref={modalRef}
                className="relative bg-[#1a1a1a] border border-white/10 rounded-2xl p-8 max-w-sm w-full shadow-2xl"
            >
                <div className="text-center">
                    <div className="w-16 h-16 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                        <svg
                            className="w-8 h-8 text-purple-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                    </div>

                    <h3 className="text-2xl font-bold text-white mb-2">
                        {title || "Sign in to save movies"}
                    </h3>

                    <p className="text-gray-400 mb-8">
                        {description || "Create an account or sign in to build your personal watchlist and favorites completely for free."}
                    </p>

                    <div className="space-y-3">
                        <button
                            onClick={onSignIn}
                            className="w-full py-3 px-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold rounded-xl transition-all duration-300 transform hover:scale-105"
                        >
                            Sign In / Sign Up
                        </button>

                        <button
                            onClick={onClose}
                            className="w-full py-3 px-4 bg-white/5 hover:bg-white/10 text-gray-300 font-medium rounded-xl transition-colors"
                        >
                            Maybe Later
                        </button>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
}
