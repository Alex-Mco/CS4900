import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Profile from '../pages/profile';
import axios from 'axios';
import { vi } from 'vitest'; // Import from vitest
import '@testing-library/jest-dom';

vi.mock('axios'); // Mock axios

describe('Profile Page', () => {
  it('renders profile data correctly', async () => {
    // Mock the API response
    axios.get.mockResolvedValue({
      data: {
        name: 'John Doe',
        username: 'johndoe',
        profilePic: 'profile-pic-url',
        email: 'john@example.com',
      },
    });

    render(<Profile />);

    await waitFor(() => screen.getByText(/John Doe/i));

    // Check if profile data is rendered
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('johndoe')).toBeInTheDocument();
    expect(screen.getByAltText('Profile')).toHaveAttribute('src', 'profile-pic-url');
  });

  it('handles editing profile', async () => {
    axios.get.mockResolvedValue({
      data: {
        name: 'John Doe',
        username: 'johndoe',
        profilePic: 'profile-pic-url',
        email: 'john@example.com',
      },
    });

    render(<Profile />);

    // Wait for the component to load data
    await waitFor(() => screen.getByText(/John Doe/i));

    // Simulate clicking the edit button
    fireEvent.click(screen.getByText('Edit Profile'));

    // Change the name and username inputs
    fireEvent.change(screen.getByPlaceholderText('Name'), { target: { value: 'Jane Doe' } });
    fireEvent.change(screen.getByPlaceholderText('Username'), { target: { value: 'janedoe' } });

    // Simulate saving the changes
    axios.put.mockResolvedValue({
      data: {
        name: 'Jane Doe',
        username: 'janedoe',
        profilePic: 'profile-pic-url',
        email: 'john@example.com',
      },
    });

    fireEvent.click(screen.getByText('Save Changes'));

    // Wait for the save to complete
    await waitFor(() => screen.getByText(/Jane Doe/i));

    // Check if the updated name and username are displayed
    expect(screen.getByText('Jane Doe')).toBeInTheDocument();
    expect(screen.getByText('janedoe')).toBeInTheDocument();
  });

  it('handles file upload for profile picture', async () => {
    axios.get.mockResolvedValue({
      data: {
        name: 'John Doe',
        username: 'johndoe',
        profilePic: 'profile-pic-url',
        email: 'john@example.com',
      },
    });

    render(<Profile />);

    // Wait for the component to load data
    await waitFor(() => screen.getByText(/John Doe/i));

    // Simulate clicking the edit button
    fireEvent.click(screen.getByText('Edit Profile'));

    // Simulate file input change
    const file = new Blob(['dummy content'], { type: 'image/jpeg' });
    const fileInput = screen.getByLabelText('Profile Picture');
    fireEvent.change(fileInput, { target: { files: [file] } });

    // Check if the preview image is shown
    expect(screen.getByAltText('Preview')).toBeInTheDocument();
  });

  it('handles API error during profile fetch', async () => {
    axios.get.mockRejectedValue(new Error('Failed to fetch'));

    render(<Profile />);

    // Check if loading message is shown
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });
});
