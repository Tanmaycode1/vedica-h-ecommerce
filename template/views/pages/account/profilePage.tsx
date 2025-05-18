import React, { useState, useEffect } from "react";
import { NextPage } from "next";
import { Input, Label, Row, Col, Form, FormGroup, Button, Spinner, Alert } from "reactstrap";
import Breadcrumb from "../../Containers/Breadcrumb";
import firebase from "../../../config/base";
import { useRouter } from "next/router";
import apiService from "../../../helpers/apiService";
import { toast } from "react-toastify";

const Profile: NextPage = () => {
  const router = useRouter();
  
  // User data state
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Form field states
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [bio, setBio] = useState("");
  
  // Address fields
  const [address, setAddress] = useState("");
  const [apartment, setApartment] = useState("");
  const [zipCode, setZipCode] = useState("");
  const [country, setCountry] = useState("India");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");

  // Check if user is authenticated and fetch profile data
  useEffect(() => {
    const unsubscribe = firebase.onAuthStateChanged(async (firebaseUser) => {
      if (firebaseUser) {
        try {
          setLoading(true);
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
            
            // Populate form fields
            setFirstName(response.user.first_name || firebaseUser.displayName?.split(' ')[0] || '');
            setLastName(response.user.last_name || firebaseUser.displayName?.split(' ')[1] || '');
            setPhone(response.user.phone || '');
            setEmail(response.user.email || firebaseUser.email || '');
            setBio(response.user.bio || '');
            
            // Address fields
            const address = response.user.address || {};
            setAddress(address.street || '');
            setApartment(address.apartment || '');
            setZipCode(address.zip_code || '');
            setCountry(address.country || 'India');
            setCity(address.city || '');
            setState(address.state || '');
          } else {
            setError("Failed to load profile data");
            toast.error("Failed to load profile data");
          }
        } catch (error) {
          console.error("Error fetching user profile:", error);
          setError("Error fetching user profile");
          toast.error("Error fetching user profile");
        } finally {
          setLoading(false);
        }
      } else {
        // Redirect to login if not authenticated
        router.push('/pages/account/login');
      }
    });

    return () => unsubscribe();
  }, []);

  // Save profile changes
  const saveProfile = async (e) => {
    e.preventDefault();
    
    try {
      setSaving(true);
      
      // Get current user and ID token
      const firebaseUser = firebase.currentUser;
      if (!firebaseUser) {
        toast.error("You must be logged in to save changes");
        return;
      }
      
      // Update displayName in Firebase if changed
      const displayName = `${firstName} ${lastName}`.trim();
      if (displayName && displayName !== firebaseUser.displayName) {
        await firebaseUser.updateProfile({
          displayName
        });
      }
      
      // Get fresh token
      const idToken = await firebaseUser.getIdToken(true);
      
      // Prepare user data for update
      const userData = {
        first_name: firstName,
        last_name: lastName,
        phone,
        bio,
        address: {
          street: address,
          apartment,
          zip_code: zipCode,
          country,
          city,
          state
        }
      };
      
      console.log("Updating profile with data:", userData);
      
      // Call backend to update profile using the apiService
      const response = await apiService.updateUserProfile(userData, idToken);
      
      if (response.success) {
        console.log("Profile updated successfully:", response);
        toast.success("Profile updated successfully");
        setUser(response.user);
        
        // Update user info in localStorage
        const userInfo = JSON.parse(localStorage.getItem("userInfo") || "{}");
        localStorage.setItem("userInfo", JSON.stringify({
          ...userInfo,
          ...response.user
        }));
        
        // Update name in localStorage if it changed
        if (displayName) {
          localStorage.setItem("Name", displayName);
        }
      } else {
        console.error("Error updating profile:", response);
        toast.error(response.message || "Error updating profile");
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Error updating profile");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center my-5 py-5">
        <Spinner color="primary" />
        <p className="mt-3">Loading profile...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="my-5">
        <Alert color="danger">
          {error}. <a href="/pages/account/login">Return to login</a>
        </Alert>
      </div>
    );
  }

  return (
    <>
      <Breadcrumb title="Profile" parent="home" />
      {/* <!-- personal detail section start --> */}
      <section className="contact-page register-page section-big-py-space bg-light">
        <div className="custom-container">
          <Row className="row">
            <Col lg="6">
              <h3 className="mb-3">PERSONAL DETAILS</h3>
              <Form className="theme-form" onSubmit={saveProfile}>
                <div className="form-row row">
                  <Col md="6">
                    <FormGroup>
                      <Label htmlFor="name">First Name</Label>
                      <Input 
                        type="text" 
                        className="form-control" 
                        id="name" 
                        placeholder="First Name" 
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        required 
                      />
                    </FormGroup>
                  </Col>
                  <Col md="6">
                    <FormGroup>
                      <Label htmlFor="last-name">Last Name</Label>
                      <Input 
                        type="text" 
                        className="form-control" 
                        id="last-name" 
                        placeholder="Last Name" 
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        required 
                      />
                    </FormGroup>
                  </Col>
                  <Col md="6">
                    <FormGroup>
                      <Label htmlFor="phone">Phone number</Label>
                      <Input 
                        type="text" 
                        className="form-control" 
                        id="phone" 
                        placeholder="Enter your number" 
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                      />
                    </FormGroup>
                  </Col>
                  <Col md="6">
                    <div>
                      <FormGroup>
                        <Label htmlFor="email">Email</Label>
                        <Input 
                          type="email" 
                          className="form-control" 
                          id="email" 
                          placeholder="Email" 
                          value={email}
                          disabled={true} // Email from Firebase cannot be changed here
                          required 
                        />
                        <small className="text-muted">Email address cannot be changed</small>
                      </FormGroup>
                    </div>
                  </Col>
                  <Col className="col-md-12">
                    <div>
                      <Label htmlFor="bio">About Me</Label>
                      <textarea 
                        className="form-control mb-0" 
                        placeholder="Tell us about yourself" 
                        id="bio"
                        value={bio}
                        onChange={(e) => setBio(e.target.value)}
                        rows={4}
                      ></textarea>
                    </div>
                  </Col>
                </div>
              </Form>
            </Col>
            <Col lg="6">
              <h3 className="mb-3 spc-responsive">SHIPPING ADDRESS</h3>
              <Form className="theme-form" onSubmit={saveProfile}>
                <div className="form-row row">
                  <Col md="6">
                    <FormGroup>
                      <Label htmlFor="home-plot">Apartment / Flat</Label>
                      <Input 
                        type="text" 
                        className="form-control" 
                        id="home-plot" 
                        placeholder="Apartment, suite, etc." 
                        value={apartment}
                        onChange={(e) => setApartment(e.target.value)}
                      />
                    </FormGroup>
                  </Col>
                  <Col md="6">
                    <FormGroup>
                      <Label htmlFor="address-input">Street Address</Label>
                      <Input 
                        type="text" 
                        className="form-control" 
                        id="address-input" 
                        placeholder="Street Address" 
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                      />
                    </FormGroup>
                  </Col>
                  <Col md="6">
                    <FormGroup>
                      <Label htmlFor="zip-code">Zip Code</Label>
                      <Input 
                        type="text" 
                        className="form-control" 
                        id="zip-code" 
                        placeholder="Zip Code" 
                        value={zipCode}
                        onChange={(e) => setZipCode(e.target.value)}
                      />
                    </FormGroup>
                  </Col>
                  <Col md="6" className="select_input">
                    <FormGroup>
                      <Label>Country</Label>
                      <select 
                        className="form-control"
                        value={country}
                        onChange={(e) => setCountry(e.target.value)}
                      >
                        <option value="India">India</option>
                        <option value="UAE">UAE</option>
                        <option value="UK">UK</option>
                        <option value="US">US</option>
                        <option value="Canada">Canada</option>
                        <option value="Australia">Australia</option>
                      </select>
                    </FormGroup>
                  </Col>
                  <Col md="6">
                    <FormGroup>
                      <Label htmlFor="city">City</Label>
                      <Input 
                        type="text" 
                        className="form-control" 
                        id="city" 
                        placeholder="City" 
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                      />
                    </FormGroup>
                  </Col>
                  <Col md="6">
                    <FormGroup>
                      <Label htmlFor="region-state">State / Region</Label>
                      <Input 
                        type="text" 
                        className="form-control" 
                        id="region-state" 
                        placeholder="State / Region" 
                        value={state}
                        onChange={(e) => setState(e.target.value)}
                      />
                    </FormGroup>
                  </Col>
                  <Col md="12">
                    <Button 
                      color="primary"
                      className="btn btn-normal" 
                      type="submit"
                      disabled={saving}
                    >
                      {saving ? <Spinner size="sm" /> : "Save Profile"}
                    </Button>
                  </Col>
                </div>
              </Form>
            </Col>
          </Row>
        </div>
      </section>
      {/* <!-- Section ends --> */}
    </>
  );
};

export default Profile;
