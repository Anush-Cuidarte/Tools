import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../services/auth';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

export default function GoogleLoginButton({ text = 'continue_with' }) {
  const containerRef = useRef(null);
  const { googleLogin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [error, setError] = useState('');
  const rendered = useRef(false);

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID || rendered.current) return undefined;

    const handleCredential = async (response) => {
      setError('');
      try {
        await googleLogin(response.credential);
        navigate(location.state?.from?.pathname || '/', { replace: true });
      } catch (err) {
        setError(err.message);
      }
    };

    const render = () => {
      if (!window.google?.accounts?.id || rendered.current) return;
      rendered.current = true;
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: handleCredential,
      });
      window.google.accounts.id.renderButton(containerRef.current, {
        theme: 'outline',
        size: 'large',
        text,
        width: 360,
      });
    };

    if (window.google?.accounts?.id) {
      render();
      return undefined;
    }

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.onload = render;
    document.head.appendChild(script);

    return () => {
      script.remove();
      rendered.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [googleLogin]);

  if (!GOOGLE_CLIENT_ID) {
    return null;
  }

  return (
    <div className="google-login">
      <div ref={containerRef} />
      {error && (
        <div className="alert alert-danger py-2 small mt-2" role="alert">
          {error}
        </div>
      )}
    </div>
  );
}
