import React from "react";
import { vi } from 'vitest';
import { render, screen, fireEvent } from "@testing-library/react";
import Login from "../pages/Login";
import '@testing-library/jest-dom';

describe("Login Component", () => {
  test("renders the login page correctly", () => {
    render(<Login />);
    
    // Check if heading is present
    expect(screen.getByText(/login/i)).toBeInTheDocument();
    
    // Check if instruction text is present
    expect(
      screen.getByText(/please log in using your google account:/i)
    ).toBeInTheDocument();
    
    // Check if login button is present
    expect(screen.getByRole("button", { name: /log in with google/i })).toBeInTheDocument();
  });

  test("redirects to Google OAuth when button is clicked", () => {
    delete window.location;
    window.location = { href: "" }; // Mock location object

    render(<Login />);
    
    const button = screen.getByRole("button", { name: /log in with google/i });
    fireEvent.click(button);
    
    expect(window.location.href).toBe("http://localhost:5000/auth/google");
  });
});
