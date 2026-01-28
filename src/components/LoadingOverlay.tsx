import "./LoadingOverlay.css";

interface LoadingOverlayProps {
    text: string;
}

export default function LoadingOverlay({ text }: LoadingOverlayProps) {
    return (
        <div className="loading-overlay">
            <div className="loading-overlay__content">{text}</div>
        </div>
    );
}
