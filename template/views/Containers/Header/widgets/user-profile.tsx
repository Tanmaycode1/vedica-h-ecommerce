import React, { useContext, useState, useEffect } from "react";
import { NextPage } from "next";
import firebase, { googleProvider } from "../../../../config/base";
import { Label, Input, Form, FormGroup, Button, Spinner } from "reactstrap";
import { toast } from "react-toastify";
import { CartContext } from "helpers/cart/cart.context";
import apiService from "../../../../helpers/apiService";
import { useRouter } from "next/router";

const UserProfile: NextPage = () => {
  const router = useRouter();
  const { emptyCart } = useContext(CartContext);
  const [openAccount, setOpenAccount] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // Check if user is already logged in on component mount
  useEffect(() => {
    const unsubscribe = firebase.onAuthStateChanged(async (firebaseUser) => {
      if (firebaseUser) {
        try {
          // Get ID token for backend authentication
          const idToken = await firebaseUser.getIdToken();
          
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
            setUser(response.user);
          } else {
            console.error("Backend authentication failed");
          }
        } catch (error) {
          console.error("Error verifying user with backend:", error);
        }
      } else {
        setUser(null);
      }
    });

    return () => unsubscribe();
  }, []);

  const signout = async () => {
    try {
      setLoading(true);
      await firebase.signOut();
      emptyCart();
      setUser(null);
      setOpenAccount(false);
      localStorage.removeItem("userInfo");
      localStorage.removeItem("Name");
      toast.success("Logged out successfully");
    } catch (error) {
      console.error("Error signing out:", error);
      toast.error("Error signing out");
    } finally {
      setLoading(false);
    }
  };

  const loginAuth = async () => {
    if (!email || !password) {
      toast.error("Please enter email and password");
      return;
    }
    
    setLoading(true);
    try {
      const userCredential = await firebase.signInWithEmailAndPassword(email, password);
      const firebaseUser = userCredential.user;
      
      // Get ID token for backend authentication
      const idToken = await firebaseUser.getIdToken();
      
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
        setUser(response.user);
        localStorage.setItem("Name", response.user.name || firebaseUser.displayName || firebaseUser.email);
        localStorage.setItem("userInfo", JSON.stringify(response.user));
        setOpenAccount(false);
        toast.success("Login successful!");
      } else {
        toast.error("Failed to authenticate with the server");
      }
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
      const result = await firebase.signInWithPopup(googleProvider);
      const firebaseUser = result.user;
      
      // Get ID token for backend authentication
      const idToken = await firebaseUser.getIdToken();
      
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
        setUser(response.user);
        localStorage.setItem("Name", response.user.name || firebaseUser.displayName || firebaseUser.email);
        localStorage.setItem("userInfo", JSON.stringify(response.user));
        setOpenAccount(false);
        toast.success("Login successful!");
      } else {
        toast.error("Failed to authenticate with the server");
      }
    } catch (error) {
      console.error("Google sign-in error:", error);
      toast.error("Google sign-in failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleNavigation = (path) => {
    router.push(path);
    setOpenAccount(false);
  };

  return (
    <>
      <li className="mobile-user onhover-dropdown" onClick={() => setOpenAccount(!openAccount)}>
        <a href="#" onClick={(e) => e.preventDefault()}>
          <i className="icon-user"></i>
        </a>
      </li>

      <div id="myAccount" className={`add_to_cart right account-bar ${openAccount ? "open-side" : ""}`}>
        <a href="#" className="overlay" onClick={() => setOpenAccount(!openAccount)}></a>
        <div className="cart-inner">
          <>
            <div className="cart_top">
              <h3>my account</h3>
              <div className="close-cart">
                <a href="#" onClick={() => setOpenAccount(!openAccount)}>
                  <i className="fa fa-times" aria-hidden="true"></i>
                </a>
              </div>
            </div>

            {user ? (
              <div className="user-profile-content">
                <div className="profile-details p-3 text-center">
                  <div className="user-avatar mb-3">
                    <i className="fa fa-user-circle fa-4x text-primary"></i>
                  </div>
                  <h5>{user.name || user.email}</h5>
                  <p className="text-muted small">{user.email}</p>
                </div>
                
                <div className="profile-actions p-3">
                  <Button 
                    color="primary" 
                    className="btn btn-sm w-100 mb-2"
                    onClick={() => handleNavigation('/pages/account/profile')}
                  >
                    <i className="fa fa-user me-2"></i>My Profile
                  </Button>
                  
                  <Button 
                    color="secondary" 
                    className="btn btn-sm w-100 mb-2"
                    onClick={() => handleNavigation('/pages/account/orders')}
                  >
                    <i className="fa fa-shopping-bag me-2"></i>My Orders
                  </Button>
                  
                  <Button 
                    color="danger" 
                    className="btn btn-sm w-100"
                    onClick={signout}
                    disabled={loading}
                  >
                    {loading ? <Spinner size="sm" /> : <><i className="fa fa-sign-out me-2"></i>Logout</>}
                  </Button>
                </div>
              </div>
            ) : (
              <Form className="userForm">
                <FormGroup>
                  <Label htmlFor="email">Email</Label>
                  <Input 
                    type="text" 
                    className="form-control" 
                    id="email" 
                    placeholder="Email" 
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)} 
                    required 
                  />
                </FormGroup>
                <FormGroup>
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
                <FormGroup>
                  <Button 
                    color="primary"
                    className="btn w-100" 
                    onClick={loginAuth}
                    disabled={loading}
                  >
                    {loading ? <Spinner size="sm" /> : "Login"}
                  </Button>
                </FormGroup>
                
                <div className="mt-3 text-center">
                  <p>Or sign in with</p>
                  <Button 
                    color="danger" 
                    className="btn w-100 mt-2" 
                    onClick={googleSignIn}
                    disabled={loading}
                  >
                    <i className="fa fa-google me-2"></i> Google
                  </Button>
                </div>

                <FormGroup className="mt-3">
                  <h5 className="forget-class">
                    <a href="/pages/account/forget-password" className="d-block" onClick={() => setOpenAccount(false)}>
                      Forgot password?
                    </a>
                  </h5>
                  <h6 className="forget-class">
                    <a href="/pages/account/register" className="d-block" onClick={() => setOpenAccount(false)}>
                      New to store? Signup now
                    </a>
                  </h6>
                </FormGroup>
              </Form>
            )}
          </>
        </div>
      </div>
    </>
  );
};

export default UserProfile;
