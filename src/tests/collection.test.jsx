import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { vi } from 'vitest';
import axios from "axios";
import CollectionPage from "../pages/collection";
import '@testing-library/jest-dom';

vi.mock("axios"); // Mock Axios

const mockCollection = {
  _id: "1",
  collectionName: "SpiderMan Comics",
  comics: [
    {
      _id: "101",
      title: "Spider-Man",
      creators: [{ role: "Writer", name: "Stan Lee" }],
      description: "A story about Spider-Man.",
    },
  ],
};

const mockComics = [
  {
    _id: "102",
    title: "Iron Man",
    creators: [{ role: "Writer", name: "Stan Lee" }],
  },
];

describe("CollectionPage Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    axios.get.mockImplementation((url) => {
        if (url.includes("/collections/")) {
            return Promise.resolve({ data: mockCollection });
          }
          if (url.includes("/comics")) {
            return Promise.resolve({ data: mockComics });
          }
          return Promise.reject(new Error("Not found"));
    });
  });

  function renderWithRouter(id) {
    render(
      <MemoryRouter initialEntries={[`/collections/${id}`]}>
        <Routes>
          <Route path="/collections/:id" element={<CollectionPage />} />
        </Routes>
      </MemoryRouter>
    );
  }

  test("displays loading state initially", async () => {
    axios.get.mockResolvedValueOnce({ data: mockCollection });
    axios.get.mockResolvedValueOnce({ data: mockComics });

    renderWithRouter("1");

    expect(screen.getByText(/Loading.../i)).toBeInTheDocument();

    expect(await screen.findByText(/SpiderMan Comics/i)).toBeInTheDocument();
  });

  test("renders collection details after fetching data", async () => {
    axios.get.mockResolvedValueOnce({ data: mockCollection });
    axios.get.mockResolvedValueOnce({ data: mockComics });

    renderWithRouter("1");

    await waitFor(() => {
      expect(screen.getByText("SpiderMan Comics")).toBeInTheDocument();
      expect(screen.getByText("Spider-Man")).toBeInTheDocument();
      expect(screen.getByText("A story about Spider-Man.")).toBeInTheDocument();
    });
  });
  test('Should delete a comic from collection', async () => {
    axios.get.mockResolvedValueOnce({ data: mockCollection }); // Load initial collection
    axios.delete.mockResolvedValueOnce({ status: 200 }); // Mock successful delete request
  
    renderWithRouter("1");
  
    // Wait for the collection to load
    await waitFor(() => {
      expect(screen.getByText("Spider-Man")).toBeInTheDocument();
    });
  
    // Find and click the "Remove" button
    const removeButton = screen.getByText("Remove");
    fireEvent.click(removeButton);
  
    // Ensure Axios DELETE request was called
    await waitFor(() => {
      expect(axios.delete).toHaveBeenCalledWith(
        "http://localhost:5000/api/users/collections/1/comics/101"
      );
    });
  
    // Ensure comic is removed from UI
    await waitFor(() => {
      expect(screen.queryByText("Spider-Man")).not.toBeInTheDocument();
    });
  });
  
});
