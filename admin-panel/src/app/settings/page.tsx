'use client';

import { useState } from 'react';
import { toast } from 'react-hot-toast';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';

export default function SettingsPage() {
  const [storeSettings, setStoreSettings] = useState({
    name: 'BigDeal E-commerce',
    email: 'admin@bigdeal.com',
    currency: 'USD',
    timezone: 'UTC',
    address: '123 Commerce St, Business City, 12345',
    phone: '+1 (555) 123-4567',
  });
  
  const [apiSettings, setApiSettings] = useState({
    apiUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002/api',
    timeout: '30000',
    maxRetries: '3',
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const handleStoreSettingsChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setStoreSettings(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleApiSettingsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setApiSettings(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleStoreSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate API call
    setTimeout(() => {
      toast.success('Store settings saved successfully');
      setIsSubmitting(false);
    }, 1000);
  };
  
  const handleApiSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate API call
    setTimeout(() => {
      toast.success('API settings saved successfully');
      setIsSubmitting(false);
    }, 1000);
  };
  
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="mt-1 text-sm text-gray-500">
          Manage your store configuration and settings.
        </p>
      </div>
      
      <Card title="Store Information">
        <form onSubmit={handleStoreSubmit} className="space-y-6">
          <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
            <div className="sm:col-span-3">
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Store Name
              </label>
              <div className="mt-1">
                <input
                  type="text"
                  name="name"
                  id="name"
                  value={storeSettings.name}
                  onChange={handleStoreSettingsChange}
                  className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                />
              </div>
            </div>
            
            <div className="sm:col-span-3">
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email Address
              </label>
              <div className="mt-1">
                <input
                  type="email"
                  name="email"
                  id="email"
                  value={storeSettings.email}
                  onChange={handleStoreSettingsChange}
                  className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                />
              </div>
            </div>
            
            <div className="sm:col-span-3">
              <label htmlFor="currency" className="block text-sm font-medium text-gray-700">
                Currency
              </label>
              <div className="mt-1">
                <select
                  id="currency"
                  name="currency"
                  value={storeSettings.currency}
                  onChange={handleStoreSettingsChange}
                  className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                >
                  <option value="USD">USD - US Dollar</option>
                  <option value="EUR">EUR - Euro</option>
                  <option value="GBP">GBP - British Pound</option>
                  <option value="CAD">CAD - Canadian Dollar</option>
                  <option value="AUD">AUD - Australian Dollar</option>
                  <option value="JPY">JPY - Japanese Yen</option>
                </select>
              </div>
            </div>
            
            <div className="sm:col-span-3">
              <label htmlFor="timezone" className="block text-sm font-medium text-gray-700">
                Timezone
              </label>
              <div className="mt-1">
                <select
                  id="timezone"
                  name="timezone"
                  value={storeSettings.timezone}
                  onChange={handleStoreSettingsChange}
                  className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                >
                  <option value="UTC">UTC</option>
                  <option value="America/New_York">Eastern Time (ET)</option>
                  <option value="America/Chicago">Central Time (CT)</option>
                  <option value="America/Denver">Mountain Time (MT)</option>
                  <option value="America/Los_Angeles">Pacific Time (PT)</option>
                  <option value="Europe/London">London</option>
                  <option value="Europe/Paris">Paris</option>
                  <option value="Asia/Tokyo">Tokyo</option>
                </select>
              </div>
            </div>
            
            <div className="sm:col-span-6">
              <label htmlFor="address" className="block text-sm font-medium text-gray-700">
                Address
              </label>
              <div className="mt-1">
                <input
                  type="text"
                  name="address"
                  id="address"
                  value={storeSettings.address}
                  onChange={handleStoreSettingsChange}
                  className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                />
              </div>
            </div>
            
            <div className="sm:col-span-3">
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                Phone Number
              </label>
              <div className="mt-1">
                <input
                  type="text"
                  name="phone"
                  id="phone"
                  value={storeSettings.phone}
                  onChange={handleStoreSettingsChange}
                  className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                />
              </div>
            </div>
          </div>
          
          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={isSubmitting}
              loading={isSubmitting}
            >
              Save Settings
            </Button>
          </div>
        </form>
      </Card>
      
      <Card title="API Connection">
        <form onSubmit={handleApiSubmit} className="space-y-6">
          <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
            <div className="sm:col-span-4">
              <label htmlFor="apiUrl" className="block text-sm font-medium text-gray-700">
                API URL
              </label>
              <div className="mt-1">
                <input
                  type="text"
                  name="apiUrl"
                  id="apiUrl"
                  value={apiSettings.apiUrl}
                  onChange={handleApiSettingsChange}
                  className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                />
              </div>
              <p className="mt-2 text-sm text-gray-500">
                The base URL for the BigDeal E-commerce API.
              </p>
            </div>
            
            <div className="sm:col-span-1">
              <label htmlFor="timeout" className="block text-sm font-medium text-gray-700">
                Timeout (ms)
              </label>
              <div className="mt-1">
                <input
                  type="number"
                  name="timeout"
                  id="timeout"
                  value={apiSettings.timeout}
                  onChange={handleApiSettingsChange}
                  className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                />
              </div>
            </div>
            
            <div className="sm:col-span-1">
              <label htmlFor="maxRetries" className="block text-sm font-medium text-gray-700">
                Max Retries
              </label>
              <div className="mt-1">
                <input
                  type="number"
                  name="maxRetries"
                  id="maxRetries"
                  value={apiSettings.maxRetries}
                  onChange={handleApiSettingsChange}
                  className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                />
              </div>
            </div>
          </div>
          
          <div className="flex justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsSubmitting(true);
                setTimeout(() => {
                  toast.success('Connection to API successful!');
                  setIsSubmitting(false);
                }, 1500);
              }}
              disabled={isSubmitting}
              className="mr-4"
            >
              Test Connection
            </Button>
            
            <Button
              type="submit"
              disabled={isSubmitting}
              loading={isSubmitting}
            >
              Save Settings
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
} 