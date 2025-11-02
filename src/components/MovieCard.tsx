import { useEffect, useRef } from "react";
import gsap from "gsap";

interface MovieCardProps {
  item: any;
  type: "movie" | "tv";
  onClick: () => void;
}

export function MovieCard({ item, type, onClick }: MovieCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const title = type === "movie" ? item.title : item.name;
  const releaseDate = type === "movie" ? item.releaseDate : item.firstAirDate;
  const posterUrl = item.posterPath 
    ? `https://image.tmdb.org/t/p/w500${item.posterPath}`
    : "/api/placeholder/300/450";

  // Animate card entrance
  useEffect(() => {
    if (cardRef.current) {
      gsap.from(cardRef.current, {
        opacity: 0,
        scale: 0.9,
        y: 20,
        duration: 0.6,
        ease: "expo.out",
        delay: Math.random() * 0.2, // Stagger cards randomly
      });
    }
  }, []);

  return (
    <div 
      ref={cardRef}
      className="group cursor-pointer"
      onClick={(e) => {
        // Click animation feedback
        gsap.to(e.currentTarget, {
          scale: 0.95,
          duration: 0.1,
          ease: "power2.in",
          yoyo: true,
          repeat: 1,
        });
        onClick();
      }}
      onMouseEnter={(e) => {
        gsap.to(e.currentTarget, {
          scale: 1.08,
          y: -5,
          rotationY: 2,
          duration: 0.4,
          ease: "power2.out",
        });
      }}
      onMouseLeave={(e) => {
        gsap.to(e.currentTarget, {
          scale: 1,
          y: 0,
          rotationY: 0,
          duration: 0.4,
          ease: "power2.out",
        });
      }}
    >
      <div className="relative overflow-hidden rounded-lg bg-gray-800 aspect-[2/3]">
        <img
          src={posterUrl}
          alt={title}
          className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-110"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjQ1MCIgdmlld0JveD0iMCAwIDMwMCA0NTAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMDAiIGhlaWdodD0iNDUwIiBmaWxsPSIjMzc0MTUxIi8+CjxwYXRoIGQ9Ik0xNTAgMjI1QzE2NS4xNTUgMjI1IDE3Ny41IDIxMi42NTUgMTc3LjUgMTk3LjVDMTc3LjUgMTgyLjM0NSAxNjUuMTU1IDE3MCAxNTAgMTcwQzEzNC44NDUgMTcwIDEyMi41IDE4Mi4zNDUgMTIyLjUgMTk3LjVDMTIyLjUgMjEyLjY1NSAxMzQuODQ1IDIyNSAxNTAgMjI1WiIgZmlsbD0iIzZCNzI4MCIvPgo8cGF0aCBkPSJNMTg3LjUgMjYyLjVIMTEyLjVDMTA1LjA0NCAyNjIuNSA5OSAyNjguNTQ0IDk5IDI3NlYzMDBDOTkgMzA3LjQ1NiAxMDUuMDQ0IDMxMy41IDExMi41IDMxMy41SDE4Ny41QzE5NC45NTYgMzEzLjUgMjAxIDMwNy40NTYgMjAxIDMwMFYyNzZDMjAxIDI2OC41NDQgMTk0Ljk1NiAyNjIuNSAxODcuNSAyNjIuNVoiIGZpbGw9IiM2QjcyODAiLz4KPC9zdmc+";
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
        
        {/* Rating Badge */}
        <div 
          className="absolute top-2 right-2 bg-black/70 backdrop-blur-sm rounded-full px-2 py-1"
          onMouseEnter={(e) => {
            gsap.to(e.currentTarget, {
              scale: 1.15,
              backgroundColor: "rgba(168, 85, 247, 0.8)",
              duration: 0.3,
              ease: "power2.out",
            });
          }}
          onMouseLeave={(e) => {
            gsap.to(e.currentTarget, {
              scale: 1,
              backgroundColor: "rgba(0, 0, 0, 0.7)",
              duration: 0.3,
              ease: "power2.out",
            });
          }}
        >
          <span className="text-yellow-400 text-xs font-semibold">
            ⭐ {item.voteAverage.toFixed(1)}
          </span>
        </div>

        {/* Hover Content */}
        <div className="absolute bottom-0 left-0 right-0 p-3 transform translate-y-full group-hover:translate-y-0 transition-transform duration-200">
          <h3 className="text-white font-semibold text-sm mb-1 line-clamp-2">{title}</h3>
          <p className="text-gray-300 text-xs">
            {new Date(releaseDate).getFullYear()}
          </p>
        </div>
      </div>
    </div>
  );
}
