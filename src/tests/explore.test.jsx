import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { vi } from 'vitest';
import axios from "axios";
import ExplorePage from "../pages/explore";
import '@testing-library/jest-dom';

vi.mock("axios");

Object.defineProperty(global.window, 'scrollTo', {
  value: () => {},
  writable: true,
});

global.alert = vi.fn(); // or jest.fn() if using Jest

describe("ExplorePage Component", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    axios.get.mockImplementation((url) => {
      if (url.includes("/profile")) {
        return Promise.resolve({ data: { _id: "123", collections: [] } });
      }
      return Promise.reject(new Error("Unexpected API call"));
    });
  });  
  afterAll(()=>{
    vi.clearAllMocks();
  })

  test("renders the explore page with search bar and buttons", async () => {
    render(<ExplorePage />);
    await waitFor(() => expect(screen.getByText(/Explore/i)).toBeInTheDocument());
    expect(screen.getByText(/Explore/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Search/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Search by Title/i })).toBeInTheDocument();
  });

  test("updates search input value", () => {
    render(<ExplorePage />);
    
    const searchInput = screen.getByPlaceholderText(/Search/i);
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
                name: "Spider-Man", // use 'name' not 'title' if your component expects it
                issue_number: "1",
                volume: { name: "Amazing Spider-Man" },
                image: { original_url: "http://example.com/image.jpg" },
                creators: { items: [{ role: "Writer", name: "Stan Lee" }] },
                description: "A great issue."
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
      screen.getByPlaceholderText(/Search/i),
      { target: { value: "Spider-Man" } }
    );
    fireEvent.click(screen.getByRole("button", { name: /Search by Title/i }));
  
    // Ensure API was called correctly
    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith("http://localhost:8080/api/search", {
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
  
    fireEvent.change(screen.getByPlaceholderText(/Search/i), { target: { value: "Hulk" } });
    fireEvent.click(screen.getByRole("button", { name: /Search by Title/i }));
  
    await waitFor(() => {
      expect(screen.getByText(/Failed to fetch comics/i)).toBeInTheDocument();
    });
  });
  




  test("pagination - loads next page", async () => {
    // 1st API call for /profile
    axios.get.mockResolvedValueOnce({ data: { _id: "123", collections: [] } });
  
    // 2nd API call: First page (20 comics)
    axios.get.mockResolvedValueOnce({
      data: { 
        results: Array.from({ length: 20 }, (_, i) => ({
          id: i + 1,
          name: `Iron Man #${i + 1}`,
          volume: { name: "Iron Man" },
          issue_number: `${i + 1}`,
          image: { original_url: "http://example.com/image.jpg" },
          person_credits: [],
        }))
      },
    });
  
    render(<ExplorePage />);
  
    fireEvent.change(screen.getByPlaceholderText(/Search/i), { target: { value: "Iron Man" } });
    fireEvent.click(screen.getByRole("button", { name: /Search by Title/i }));
  
    await waitFor(() => {
      expect(screen.getAllByText(/Iron Man #1/i).length).toBeGreaterThan(0);
      expect(screen.getByRole("button", { name: /Next/i })).toBeInTheDocument();
    });
  
    // 3rd API call: Second page (Thor)
    axios.get.mockResolvedValueOnce({
      data: {
        results: [
          { 
            id: 21,
            name: "Thor #1",
            volume: { name: "Mighty Thor" },
            issue_number: "1",
            image: { original_url: "http://example.com/thor.jpg" },
            person_credits: [],
          }
        ]
      }
    });
  
    fireEvent.click(screen.getByRole("button", { name: /Next/i }));
  
    await waitFor(() => {
      expect(screen.getByText(/Thor #1/i)).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /Next/i })).toBeInTheDocument();
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
            {
              id: 1,
              name: "Spider-Man", // use 'name' not 'title' if your component expects it
              issue_number: "1",
              volume: { name: "Amazing Spider-Man" },
              image: { original_url: "http://example.com/image.jpg" },
              creators: { items: [{ role: "Writer", name: "Stan Lee" }] },
              description: "A great issue."
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

    fireEvent.change(screen.getByPlaceholderText(/Search/i), { target: { value: "Spider-Man" } });
    fireEvent.click(screen.getByRole("button", { name: /Search by Title/i }));

    // Ensure a comic is displayed
    await waitFor(() => {
      expect(screen.getByText(/Spider-Man/i)).toBeInTheDocument();
    });

    // Click on the comic to trigger selection
    fireEvent.click(screen.getByRole("heading", { name: /Spider-Man/i }));

    await waitFor(() => {
      expect(screen.getByText(/Add to Collection/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Favorites/i)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByLabelText(/Favorites/i));
    fireEvent.click(screen.getByRole("button", { name: /Confirm/i }));

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith("http://localhost:8080/api/users/123/comics/add-to-collections", expect.any(Object));
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
            {
              id: 1,
              name: "Spider-Man", // use 'name' not 'title' if your component expects it
              issue_number: "1",
              volume: { name: "Amazing Spider-Man" },
              image: { original_url: "http://example.com/image.jpg" },
              creators: { items: [{ role: "Writer", name: "Stan Lee" }] },
              description: "A great issue."
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

    fireEvent.change(screen.getByPlaceholderText(/Search/i), { target: { value: "Spider-Man" } });
    fireEvent.click(screen.getByRole("button", { name: /Search by Title/i }));

    await waitFor(() => {
      expect(screen.getByText(/Spider-Man/i)).toBeInTheDocument();
    });
    
    // Click on the comic to trigger selection
    fireEvent.click(screen.getByRole("heading", { name: /Spider-Man/i }));

    await waitFor(() => {
      expect(screen.getByText(/Add to Collection/i)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByLabelText(/Favorites/i));
    fireEvent.click(screen.getByRole("button", { name: /Confirm/i }));

    await waitFor(() => {
      expect(screen.getByText(/Failed to add comic to collection/i)).toBeInTheDocument();
    });
  });
});
