import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { vi } from 'vitest';
import axios from "axios";
import ExplorePage from "../pages/explore";
import '@testing-library/jest-dom';

vi.mock("axios");

describe("ExplorePage Component", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    axios.get.mockImplementation((url) => {
        if (url.includes("/profile")) {
          return Promise.resolve({ data: { _id: "123", collections: [] } });
        }
        return Promise.resolve({ data: { results: [], total: 0 } });
      });
  });
  afterAll(()=>{
    vi.clearAllMocks();
  })

  test("renders the explore page with search bar and buttons", async () => {
    render(<ExplorePage />);
    await waitFor(() => expect(screen.getByText(/Explore/i)).toBeInTheDocument());
    expect(screen.getByText(/Explore/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Search for comics or characters/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Search/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Previous/i })).toBeDisabled();
    expect(screen.getByRole("button", { name: /Next/i })).toBeDisabled();
  });

  test("updates search input value", () => {
    render(<ExplorePage />);
    
    const searchInput = screen.getByPlaceholderText(/Search for comics or characters/i);
    fireEvent.change(searchInput, { target: { value: "Spider-Man" } });
    
    expect(searchInput.value).toBe("Spider-Man");
  });

  test("triggers search API request on search button click", async () => {
    axios.get.mockImplementation((url) => {
      if (url.includes("/profile")) {
        return Promise.resolve({ data: { _id: "123", collections: [] } });
      }
      if (url.includes("/api/search")) {
        return Promise.resolve({
          data: {
            results: [
              {
                id: 1,
                title: "Spider-Man",
                thumbnail: { path: "http://example.com/image", extension: "jpg" },
                creators: { items: [{ role: "Writer", name: "Stan Lee" }] },
                series: { name: "Amazing Spider-Man" },
              },
            ],
            total: 1,
          },
        });
      }
      return Promise.reject(new Error("Unexpected API call"));
    });
    
  
    render(<ExplorePage />);
  
    fireEvent.change(
      screen.getByPlaceholderText(/Search for comics or characters/i),
      { target: { value: "Spider-Man" } }
    );
    fireEvent.click(screen.getByRole("button", { name: /Search/i }));
  
    // Ensure API was called correctly
    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith("http://localhost:5000/api/search", {
        params: { title: "Spider-Man", offset: 0 },
      });
    });
  
    // Debug the output before checking
    await waitFor(() => {
      screen.debug();
    });
  
    // Check if Spider-Man appears inside an <h3> (as per ExplorePage.jsx)
    await waitFor(() => {
      expect(screen.getByRole("heading", { name: /Spider-Man/i })).toBeInTheDocument();
    });
  });
  

  test("handles error during search", async () => {
    axios.get.mockImplementation((url) => {
    
      if (url.includes("/profile")) {
        return Promise.resolve({ data: { _id: "123", collections: [] } });
      }
    
      if (url.includes("/api/search")) {
        return Promise.reject(new Error("Failed to fetch comics"));
      }
    
      return Promise.reject(new Error("Unexpected API call"));
    });
      
    render(<ExplorePage />);
  
    fireEvent.change(screen.getByPlaceholderText(/Search for comics or characters/i), { target: { value: "Hulk" } });
    fireEvent.click(screen.getByRole("button", { name: /Search/i }));
  
    await waitFor(() => {
      expect(screen.getByText(/Failed to fetch comics/i)).toBeInTheDocument();
    });
  });
  

  test("pagination - loads next page", async () => {
    axios.get.mockImplementation((url) => {
      if (url.includes("/profile")) {
        return Promise.resolve({ data: { _id: "123", collections: [] } });
      }
      if (url.includes("/api/search")) {
        return Promise.resolve({
          data: { 
            results: [
              { id: 2, 
                title: "Iron Man", 
                thumbnail: { path: "image", extension: "jpg" }, 
                creators: { items: [] } 
              }
            ], 
            total: 30 
          },
        });
      }
      return Promise.reject(new Error("Unexpected API call"));
    });

    render(<ExplorePage />);

    fireEvent.change(screen.getByPlaceholderText(/Search for comics or characters/i), { target: { value: "Iron Man" } });
    fireEvent.click(screen.getByRole("button", { name: /Search/i }));

    await waitFor(() => {
      expect(screen.getByText(/Iron Man/i)).toBeInTheDocument();
    });

    axios.get.mockResolvedValueOnce({
      data: { results: [{ id: 3, title: "Thor", thumbnail: { path: "image", extension: "jpg" }, creators: { items: [] } }], total: 30 },
    });

    fireEvent.click(screen.getByRole("button", { name: /Next/i }));

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith("http://localhost:5000/api/search", {
        params: { title: "Iron Man", offset: 20 },
      });
    });
  });

  test("adds a comic to collection and confirms selection", async () => {
    axios.get.mockImplementation((url) => {
      if (url.includes("/profile")) {
        return Promise.resolve({ data: { _id: "123", collections: [] } });
      }
      if (url.includes("/api/search")) {
        return Promise.resolve({
          data: { results: [
            { id: 1, 
              title: "Spider-Man", 
              thumbnail: { path: "image", extension: "jpg" }, 
              creators: { items: [] }, 
              series: { name: "Marvel Comics" } 
            }], 
            total: 1 
          },
        });
      }
      return Promise.reject(new Error("Unexpected API call"));
    });

    axios.get.mockResolvedValueOnce({
      data: { _id: "123", collections: [{ _id: "abc", collectionName: "Favorites" }] },
    });

    render(<ExplorePage />);

    fireEvent.change(screen.getByPlaceholderText(/Search for comics or characters/i), { target: { value: "Spider-Man" } });
    fireEvent.click(screen.getByRole("button", { name: /Search/i }));

    await waitFor(() => {
      expect(screen.getByText(/Spider-Man/i)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: /Add to Collection/i }));

    await waitFor(() => {
      expect(screen.getByText(/Select a Collection/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Favorites/i)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByLabelText(/Favorites/i));
    fireEvent.click(screen.getByRole("button", { name: /Confirm/i }));

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith("http://localhost:5000/users/123/collections/abc/comics", expect.any(Object));
    });
  });

  test("handles error when adding to collection", async () => {
    axios.get.mockImplementation((url) => {
      if (url.includes("/profile")) {
        return Promise.resolve({ data: { _id: "123", collections: [] } });
      }
      if (url.includes("/api/search")) {
        return Promise.resolve({
          data: { results: [
            { id: 1, 
              title: "Spider-Man", 
              thumbnail: { path: "image", extension: "jpg" }, 
              creators: { items: [] }, 
              series: { name: "Marvel Comics" } 
            }], 
            total: 1 
          },
        });
      }
      return Promise.reject(new Error("Unexpected API call"));
    });

    axios.get.mockResolvedValueOnce({
      data: { _id: "123", collections: [{ _id: "abc", collectionName: "Favorites" }] },
    });

    axios.post.mockRejectedValueOnce(new Error("Failed to add comic to collection"));

    render(<ExplorePage />);

    fireEvent.change(screen.getByPlaceholderText(/Search for comics or characters/i), { target: { value: "Spider-Man" } });
    fireEvent.click(screen.getByRole("button", { name: /Search/i }));

    await waitFor(() => {
      expect(screen.getByText(/Spider-Man/i)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: /Add to Collection/i }));

    await waitFor(() => {
      expect(screen.getByText(/Select a Collection/i)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByLabelText(/Favorites/i));
    fireEvent.click(screen.getByRole("button", { name: /Confirm/i }));

    await waitFor(() => {
      expect(screen.getByText(/Failed to add comic to collection/i)).toBeInTheDocument();
    });
  });
});
