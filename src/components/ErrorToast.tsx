import "./ErrorToast.css";

interface ErrorToastProps {
    message: string;
}

export default function ErrorToast({ message }: ErrorToastProps) {
    return <div className="error-toast">❌ {message}</div>;
}
