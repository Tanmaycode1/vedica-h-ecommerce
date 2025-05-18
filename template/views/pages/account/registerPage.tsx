import React, { useState, useEffect } from "react";
import { NextPage } from "next";
import { Label, Input, Row, Col, Form, FormGroup, Button, Spinner } from "reactstrap";
import Breadcrumb from "../../Containers/Breadcrumb";
import firebase, { googleProvider } from "../../../config/base";
import { toast } from "react-toastify";
import { useRouter } from "next/router";
import apiService from "../../../helpers/apiService";

const RegisterPage: NextPage = () => {
  const router = useRouter();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Check if user is already logged in
    const unsubscribe = firebase.onAuthStateChanged(async (user) => {
      if (user) {
        try {
          // Get ID token for backend authentication
          const idToken = await user.getIdToken();
          
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
          
          if (response.success) {
            localStorage.setItem("Name", response.user.name || user.displayName || user.email);
            localStorage.setItem("userInfo", JSON.stringify(response.user));
            toast.success("Already logged in!");
            router.push("/");
          }
        } catch (error) {
          console.error("Error verifying user with backend:", error);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  const registerWithEmail = async () => {
    if (!firstName || !lastName || !email || !password) {
      toast.error("Please fill all required fields");
      return;
    }

    if (password.length < 6) {
      toast.error("Password should be at least 6 characters");
      return;
    }

    setLoading(true);
    try {
      // Create user with email and password
      const userCredential = await firebase.createUserWithEmailAndPassword(email, password);
      const user = userCredential.user;

      // Update profile with name
      await user.updateProfile({
        displayName: `${firstName} ${lastName}`
      });

      // Get ID token for backend authentication
      const idToken = await user.getIdToken(true);
      
      // Register with backend
      await authenticateWithBackend(idToken, user);
    } catch (error) {
      console.error("Registration error:", error);
      const errorCode = error.code;
      let errorMessage = "An error occurred during registration";
      
      if (errorCode === 'auth/email-already-in-use') {
        errorMessage = "Email is already in use";
      } else if (errorCode === 'auth/invalid-email') {
        errorMessage = "Invalid email format";
      } else if (errorCode === 'auth/weak-password') {
        errorMessage = "Password is too weak";
      }
      
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const googleSignUp = async () => {
    setLoading(true);
    try {
      const result = await firebase.signInWithPopup(googleProvider);
      const user = result.user;
      
      // Get ID token for backend authentication
      const idToken = await user.getIdToken();
      
      // Register with backend
      await authenticateWithBackend(idToken, user);
    } catch (error) {
      console.error("Google sign-up error:", error);
      toast.error("Google sign-up failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const authenticateWithBackend = async (idToken, user) => {
    try {
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
      
      if (response.success) {
        localStorage.setItem("Name", response.user.name || user.displayName || user.email);
        localStorage.setItem("userInfo", JSON.stringify(response.user));
        toast.success("Registration successful!");
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
      <Breadcrumb title="Register" parent="home" />
      {/* <!--section start--> */}
      <section className="login-page section-big-py-space bg-light">
        <div className="custom-container">
          <Row className="row">
            <Col lg="4" className="offset-lg-4">
              <div className="theme-card">
                <h3 className="text-center">Create account</h3>
                <Form className="theme-form">
                  <div className="form-row row">
                    <FormGroup className="col-md-12">
                      <Label htmlFor="fname">First Name</Label>
                      <Input 
                        type="text" 
                        className="form-control" 
                        id="fname" 
                        placeholder="First Name" 
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        required 
                      />
                    </FormGroup>
                    <FormGroup className="col-md-12">
                      <Label htmlFor="lname">Last Name</Label>
                      <Input 
                        type="text" 
                        className="form-control" 
                        id="lname" 
                        placeholder="Last Name" 
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        required 
                      />
                    </FormGroup>
                  </div>
                  <div className="form-row row">
                    <FormGroup className="col-md-12">
                      <Label htmlFor="email">Email</Label>
                      <Input 
                        type="email" 
                        className="form-control" 
                        id="email" 
                        placeholder="Email" 
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required 
                      />
                    </FormGroup>
                    <FormGroup className="col-md-12">
                      <Label htmlFor="password">Password</Label>
                      <Input 
                        type="password" 
                        className="form-control" 
                        id="password" 
                        placeholder="Enter your password" 
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required 
                      />
                    </FormGroup>
                    <FormGroup className="col-md-12">
                      <Button 
                        color="primary"
                        className="btn w-100" 
                        onClick={registerWithEmail}
                        disabled={loading}
                      >
                        {loading ? <Spinner size="sm" /> : "Create Account"}
                      </Button>
                    </FormGroup>
                  </div>
                  
                  <div className="mt-4 text-center">
                    <p>Or sign up with</p>
                    <Button 
                      color="danger" 
                      className="btn w-100 mt-2" 
                      onClick={googleSignUp}
                      disabled={loading}
                    >
                      <i className="fa fa-google me-2"></i> 
                      Sign up with Google
                    </Button>
                  </div>
                  
                  <div className="form-row row">
                    <Col md="12" className="mt-4 text-center">
                      <p>
                        Already have an account?{" "}
                        <a href="/pages/account/login" className="txt-default">
                          Login
                        </a>
                      </p>
                    </Col>
                  </div>
                </Form>
              </div>
            </Col>
          </Row>
        </div>
      </section>
      {/* <!--Section ends--> */}
    </>
  );
};

export default RegisterPage;
