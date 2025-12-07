export interface ImagePalette {
    primary: string;
    secondary: string;
    background: string;
    text: string;
}

export const analyzeImage = async (imageUrl: string): Promise<ImagePalette | null> => {
    return new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = "Anonymous";
        img.src = imageUrl;

        img.onload = () => {
            const canvas = document.createElement("canvas");
            const ctx = canvas.getContext("2d");
            if (!ctx) {
                resolve(null);
                return;
            }

            // Resize for faster processing
            canvas.width = 100;
            canvas.height = 100 * (img.height / img.width);
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const data = imageData.data;
            const colorCounts: Record<string, number> = {};
            let maxCount = 0;
            let dominant = "0,0,0";

            // Simple histogram bucket approach
            for (let i = 0; i < data.length; i += 4 * 10) { // Sample every 10th pixel
                const r = data[i];
                const g = data[i + 1];
                const b = data[i + 2];
                const a = data[i + 3];

                if (a < 200) continue; // Skip transparent/translucent pixels

                // Round to nearest 10 to group similar colors
                const key = `${Math.round(r / 10) * 10},${Math.round(g / 10) * 10},${Math.round(b / 10) * 10}`;
                colorCounts[key] = (colorCounts[key] || 0) + 1;

                if (colorCounts[key] > maxCount) {
                    maxCount = colorCounts[key];
                    dominant = key;
                }
            }

            const [r, g, b] = dominant.split(",").map(Number);

            // Determine brightness to ensure readability
            const brightness = (r * 299 + g * 587 + b * 114) / 1000;
            const isDark = brightness < 128;

            resolve({
                primary: `rgb(${r}, ${g}, ${b})`,
                secondary: `rgb(${Math.min(r + 30, 255)}, ${Math.min(g + 30, 255)}, ${Math.min(b + 30, 255)})`,
                background: `rgb(${Math.max(r - 150, 10)}, ${Math.max(g - 150, 10)}, ${Math.max(b - 150, 10)})`, // Much darker version for bg
                text: isDark ? "#ffffff" : "#000000"
            });
        };

        img.onerror = () => {
            resolve(null);
        };
    });
};
