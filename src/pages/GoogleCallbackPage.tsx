import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getRedirectResult } from 'firebase/auth';
import { auth } from '../firebase';
import { getApiUrl } from '../lib/api';
import { useAuth } from '../hooks/useAuth';

export default function GoogleCallbackPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
console.log("GOOGLE CALLBACK COMPONENT RENDERED");
  useEffect(() => {
    console.log("USE EFFECT STARTED");
    console.log("GoogleCallbackPage mounted");
    const completeGoogleAuth = async () => {
      try {console.log("STEP 1 - Google callback started");

const result = await getRedirectResult(auth);
console.log("STEP 2 - Redirect Result:", result);

const firebaseUser = result?.user;
console.log("STEP 3 - Firebase User:", firebaseUser);

if (!firebaseUser) {
  console.log("STEP 4 - No Firebase user");
  navigate("/", { replace: true });
  return;
}

console.log("STEP 5 - Calling backend");

const res = await fetch(getApiUrl("/api/auth/google"), {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    uid: firebaseUser.uid,
    email: firebaseUser.email,
    firstName: firebaseUser.displayName?.split(" ")[0] || "",
    lastName: firebaseUser.displayName?.split(" ").slice(1).join(" ") || "",
    photoURL: firebaseUser.photoURL || "",
  }),
});

console.log("STEP 6 - Backend Status:", res.status);

const data = await res.json();
console.log("STEP 7 - Backend Response:", data);

localStorage.setItem("token", data.token);
localStorage.setItem("user", JSON.stringify(data.user));

console.log("STEP 8 - Saved to localStorage");

login(data.user);

console.log("STEP 9 - login() called");
const redirectPath = data.user.role === 'admin' ? '/admin' : '/';
navigate(redirectPath, { replace: true });
      } catch (error) {
        console.error('Google callback failed:', error);
        navigate('/', { replace: true });
      }
    };

    completeGoogleAuth();
  }, [login, navigate]);

  return null;
}
