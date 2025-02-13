import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Profile from '../pages/profile';
import axios from 'axios';
import { vi } from 'vitest';
import { act } from 'react-dom/test-utils';
import '@testing-library/jest-dom';

vi.mock('axios'); // Mock axios

describe('Profile Page', () => {
  const renderWithRouter = () => {
    render(
      <MemoryRouter>
        <Profile />
      </MemoryRouter>
    );
  };

  test('renders profile data correctly', async () => {
    axios.get.mockResolvedValueOnce({
      data: {
        name: 'John Doe',
        username: 'johndoe',
        profilePic: 'profile-pic-url',
        email: 'john@example.com',
      },
    });

    renderWithRouter();

    expect(await screen.findByText(/John Doe/i)).toBeInTheDocument();
    expect(await screen.findByText(/johndoe/i)).toBeInTheDocument();
    expect(await screen.findByAltText('Profile')).toHaveAttribute('src', 'profile-pic-url');
  });

  test('handles editing profile', async () => {
    axios.get.mockResolvedValueOnce({
      data: {
        name: 'John Doe',
        username: 'johndoe',
        profilePic: 'profile-pic-url',
        email: 'john@example.com',
      },
    });
  
    renderWithRouter();
  
    // Wait for profile data to load
    await screen.findByText(/John Doe/i);
  
    // Click "Edit Profile" to activate input fields
    fireEvent.click(screen.getByText(/Edit Profile/i));
  
    // Wait for the input fields to appear
    const nameInput = screen.getByDisplayValue('John Doe');
    const usernameInput = screen.getByDisplayValue('johndoe');
  
    // Change values
    fireEvent.change(nameInput, { target: { value: 'Jane Doe' } });
    fireEvent.change(usernameInput, { target: { value: 'janedoe' } });
  
    // Mock save profile request
    axios.put.mockResolvedValueOnce({
      data: {
        name: 'Jane Doe',
        username: 'janedoe',
        profilePic: 'profile-pic-url',
        email: 'john@example.com',
      },
    });
  
    // Click "Save Changes" inside `act()` to ensure re-render
    await act(async () => {
      fireEvent.click(screen.getByText(/Save Changes/i));
    });
  
    // Wait for state update before checking new values
    await waitFor(() => {
      expect(screen.getByText(/Jane Doe/i)).toBeInTheDocument();
      expect(screen.getByText(/janedoe/i)).toBeInTheDocument();
    });
  });
  

  test('handles file upload for profile picture', async () => {
    axios.get.mockResolvedValueOnce({
      data: {
        name: 'John Doe',
        username: 'johndoe',
        profilePic: 'profile-pic-url',
        email: 'john@example.com',
      },
    });

    renderWithRouter();

    await screen.findByText(/John Doe/i);

    fireEvent.click(screen.getByText('Edit Profile'));

    const file = new Blob(['dummy content'], { type: 'image/jpeg' });
    const fileInput = screen.getByLabelText('Profile Picture');
    fireEvent.change(fileInput, { target: { files: [file] } });

    expect(await screen.findByAltText('Preview')).toBeInTheDocument();
  });

  test('handles API error during profile fetch', async () => {
    axios.get.mockRejectedValueOnce(new Error('Failed to fetch'));

    renderWithRouter();

    expect(await screen.findByText('Loading...')).toBeInTheDocument();
  });
});
