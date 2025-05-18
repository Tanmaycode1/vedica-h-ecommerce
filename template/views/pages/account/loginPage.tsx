import React, { useEffect, useState } from "react";
import { NextPage } from "next";
import Breadcrumb from "../../Containers/Breadcrumb";
import { Row, Col, Input, Label, Button, Spinner } from "reactstrap";
import { useRouter } from "next/router";
import firebase, { googleProvider } from "../../../config/base";
import { toast } from "react-toastify";
import apiService from "../../../helpers/apiService";

const Login: NextPage = () => {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Check if user is already logged in
    const unsubscribe = firebase.onAuthStateChanged(async (user) => {
      if (user) {
        try {
          console.log("Firebase user found:", user.email);
          // Get ID token for backend authentication
          const idToken = await user.getIdToken();
          console.log("ID token obtained, length:", idToken.length);
          
          // Call backend profile endpoint with Firebase token
          console.log("Calling backend profile endpoint");
          const response = await apiService.fetchWithHeaders(
            '/api/auth/firebase/profile',
            { 
              method: 'GET',
              headers: {
                'Authorization': `Bearer ${idToken}`
              }
            }
          );
          
          console.log("Backend response:", response);
          
          if (response.success) {
            setName(response.user.name || user.displayName || user.email);
            localStorage.setItem("Name", response.user.name || user.displayName || user.email);
            localStorage.setItem("userInfo", JSON.stringify(response.user));
            toast.success("Already logged in!");
            router.push("/");
          } else {
            console.error("Backend authentication failed:", response);
          }
        } catch (error) {
          console.error("Error verifying user with backend:", error);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  const loginAuth = async (email, password) => {
    if (!email || !password) {
      toast.error("Please enter email and password");
      return;
    }
    
    setLoading(true);
    try {
      console.log("Attempting email/password login with:", email);
      const userCredential = await firebase.signInWithEmailAndPassword(email, password);
      const user = userCredential.user;
      console.log("Firebase login successful for:", user.email);
      
      // Get ID token for backend authentication
      const idToken = await user.getIdToken();
      console.log("ID token obtained, length:", idToken.length);
      
      // Call backend profile endpoint with Firebase token
      await authenticateWithBackend(idToken, user);
    } catch (error) {
      console.error("Login error:", error);
      const errorCode = error.code;
      let errorMessage = "An error occurred during login";
      
      if (errorCode === 'auth/user-not-found') {
        errorMessage = "No account found with this email";
      } else if (errorCode === 'auth/wrong-password') {
        errorMessage = "Invalid password";
      } else if (errorCode === 'auth/invalid-email') {
        errorMessage = "Invalid email format";
      }
      
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const googleSignIn = async () => {
    setLoading(true);
    try {
      console.log("Attempting Google sign-in");
      const result = await firebase.signInWithPopup(googleProvider);
      const user = result.user;
      console.log("Google sign-in successful for:", user.email);
      
      // Get ID token for backend authentication
      const idToken = await user.getIdToken();
      console.log("ID token obtained, length:", idToken.length);
      
      // Call backend profile endpoint with Firebase token
      await authenticateWithBackend(idToken, user);
    } catch (error) {
      console.error("Google sign-in error:", error);
      toast.error("Google sign-in failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const authenticateWithBackend = async (idToken, user) => {
    try {
      console.log("Calling backend profile endpoint");
      // Call backend profile endpoint with Firebase token
      const response = await apiService.fetchWithHeaders(
        '/api/auth/firebase/profile',
        { 
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${idToken}`
          }
        }
      );
      
      console.log("Backend response:", response);
      
      if (response.success) {
        setName(response.user.name || user.displayName || user.email);
        localStorage.setItem("Name", response.user.name || user.displayName || user.email);
        localStorage.setItem("userInfo", JSON.stringify(response.user));
        toast.success("Login successful!");
        router.push("/");
      } else {
        toast.error("Failed to authenticate with the server");
      }
    } catch (error) {
      console.error("Backend authentication error:", error);
      toast.error("Server authentication failed. Please try again.");
    }
  };

  return (
    <>
      {/* <!-- breadcrumb start --> */}
      <Breadcrumb title="login" parent="home" />
      {/* <!-- breadcrumb End --> */}

      {/* <!--section start--> */}
      <section className="login-page section-big-py-space bg-light">
        <div className="custom-container">
          <Row className="row">
            <Col xl="4" lg="6" md="8" className="offset-xl-4 offset-lg-3 offset-md-2">
              <div className="theme-card">
                <h3 className="text-center">Login</h3>
                <form className="theme-form">
                  <div className="form-group">
                    <Label htmlFor="email">Email</Label>
                    <Input type="text" value={email} onChange={(e) => setEmail(e.target.value)} className="form-control" id="email" placeholder="Email" required />
                  </div>
                  <div className="form-group">
                    <Label htmlFor="review">Password</Label>
                    <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="form-control" id="review" placeholder="Enter your password" required />
                  </div>
                  <Button 
                    color="primary" 
                    className="btn btn-normal w-100" 
                    onClick={() => loginAuth(email, password)}
                    disabled={loading}
                  >
                    {loading ? <Spinner size="sm" /> : "Login"}
                  </Button>
                  <div className="text-center mt-3">
                    <a className="txt-default" href="/pages/account/forget-password" id="fgpwd">
                      Forgot your password?
                    </a>
                  </div>
                </form>
                
                <div className="mt-4 text-center">
                  <p>Or sign in with</p>
                  <Button 
                    color="danger" 
                    className="btn w-100 mt-2" 
                    onClick={googleSignIn}
                    disabled={loading}
                  >
                    <i className="fa fa-google me-2"></i> 
                    Login with Google
                  </Button>
                </div>
                
                <p className="mt-4 text-center">
                  Don't have an account?{" "}
                  <a href="/pages/account/register" className="txt-default">
                    Create an Account
                  </a>
                </p>
              </div>
            </Col>
          </Row>
        </div>
      </section>
      {/* <!--Section ends--> */}
    </>
  );
};

export default Login;
