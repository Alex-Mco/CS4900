import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom'; // Required to wrap the component for routing
import Navbar from '../components/navbar'; // Import the Navbar component

describe('Navbar', () => {
  it('renders the navbar with the correct links', () => {
    render(
      <BrowserRouter>
        <Navbar />
      </BrowserRouter>
    );

    // Check if the Navbar title is rendered
    expect(screen.getByText('Marvel Nexus')).toBeInTheDocument();

    // Check if the navigation links are rendered
    expect(screen.getByText('Profile')).toBeInTheDocument();
    expect(screen.getByText('Collections')).toBeInTheDocument();
    expect(screen.getByText('Explore')).toBeInTheDocument();
  });

  it('links have correct hrefs', () => {
    render(
      <BrowserRouter>
        <Navbar />
      </BrowserRouter>
    );

    // Check the href attributes of the links
    expect(screen.getByText('Profile').closest('a')).toHaveAttribute('href', '/profile');
    expect(screen.getByText('Collections').closest('a')).toHaveAttribute('href', '/collections');
    expect(screen.getByText('Explore').closest('a')).toHaveAttribute('href', '/explore');
  });
});
