import { useState, useEffect, useRef } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { OverlayPanel } from "primereact/overlaypanel";
import { InputNumber } from "primereact/inputnumber";

interface Artwork {
  id: number;
  title: string;
  place_of_origin?: string;
  artist_display?: string;
  inscriptions?: string;
  date_start?: number;
  date_end?: number;
}

interface ApiResponse {
  data: Artwork[];
  pagination: {
    total_pages: number;
  };
}

export default function TableData() {
  const [products, setProducts] = useState<Artwork[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<Artwork[] | null>(
    null
  );
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [rowCount, setRowCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);

  // const handleSubmit = async () => {
  //   const targetCount = rowCount ?? 0;
  //   const selected: Artwork[] = [];
  //   let currentPage = 1;

  //   while (selected.length < targetCount && currentPage <= totalPages) {
  //     const res = await fetch(
  //       `https://api.artic.edu/api/v1/artworks?page=${currentPage}`
  //     );
  //     const json: ApiResponse = await res.json();

  //     const remaining = targetCount - selected.length;
  //     selected.push(...json.data.slice(0, remaining));

  //     if (json.data.length >= remaining) {
  //       break; // we got enough
  //     }

  //     currentPage++;
  //   }

  //   setSelectedProducts(selected);
  //   setPage(1); // Optional: go back to page 1 so the user sees the first page
  //   op.current?.hide();
  // };
  const handleSubmit = async () => {
    const targetCount = rowCount ?? 0;
    const perPage = 12;
    const pagesNeeded = Math.ceil(targetCount / perPage);

    const pageNumbers = Array.from({ length: pagesNeeded }, (_, i) => i + 1);

    try {
      setLoading(true);

      const fetches = pageNumbers.map((pageNum) =>
        fetch(`https://api.artic.edu/api/v1/artworks?page=${pageNum}`).then(
          (res) => res.json()
        )
      );

      const results: ApiResponse[] = await Promise.all(fetches);

      const allData = results.flatMap((result) => result.data);
      const slicedData = allData.slice(0, targetCount);

      setSelectedProducts(slicedData);
      setLoading(false);
      setPage(1);
      op.current?.hide();
    } catch (error) {
      console.error("Bulk fetch error:", error);
      setLoading(false);
    }
  };

  const headerTemplate = () => (
    <div
      style={{ cursor: "pointer", display: "flex", justifyContent: "center" }}
      onClick={(e) => op.current?.toggle(e)}
    >
      <i className="pi pi-chevron-down"></i>
    </div>
  );

  const fetchArtworks = async (pageNum: number) => {
    try {
      setLoading(true);
      const res = await fetch(
        `https://api.artic.edu/api/v1/artworks?page=${pageNum}`
      );
      const json: ApiResponse = await res.json();
      setLoading(false);
      setProducts(json.data);
      setTotalPages(json.pagination.total_pages);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchArtworks(page);
  }, [page]);

  const op = useRef<OverlayPanel>(null);
  console.log(rowCount);
  return (
    <div className="p-2">
      <div className="bg-white shadow-md rounded-lg p-6">
        <p className="text-sm text-gray-500 text-center mb-6">
          Page {page} of {totalPages}
        </p>
        <OverlayPanel ref={op}>
          <div className="p-2 flex flex-col gap-2">
            <label htmlFor="rowCount">How many rows to select?</label>
            <InputNumber
              id="rowCount"
              value={rowCount}
              onValueChange={(e) => setRowCount(Number(e.value))}
              placeholder="Selec Rows"
              // min={1}
              // showButtons
            />
            <Button
              label="Submit"
              onClick={handleSubmit}
              size="small"
              className="p-button-sm bg-amber-50"
            />
          </div>
        </OverlayPanel>

        <DataTable
          value={products}
          selection={selectedProducts!}
          onSelectionChange={(e) =>
            setSelectedProducts(e.value as unknown as Artwork[])
          }
          loading={loading}
          dataKey="id"
          selectionMode="multiple"
          tableStyle={{ minWidth: "50rem", maxWidth: "1440px", width: "auto" }}
        >
          <Column
            selectionMode="multiple"
            headerStyle={{
              width: "3rem",
              // background: "red",

              placeItems: "center",
            }}
          />
          <Column
            header={headerTemplate()}
            headerStyle={{ width: "3rem", textAlign: "center" }}
          />

          <Column field="title" header="Title" />
          <Column field="place_of_origin" header="Place Of Origin" />
          <Column field="artist_display" header="Artist Display" />
          <Column field="inscriptions" header="Artist Inscriptions" />
          <Column field="date_start" header="Date Start" />
          <Column field="date_end" header="Date End" />
        </DataTable>

        <div className="flex justify-center items-center mt-6 gap-2 flex-wrap">
          <Button
            icon="pi pi-angle-left"
            onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
            disabled={page === 1}
            className="p-button-rounded p-button-text"
          />

          {Array.from({ length: totalPages }, (_, i) => i + 1)
            .filter((pageNum) => {
              if (totalPages <= 5) return true; // if <= 5 pages, show all
              if (page <= 3) return pageNum <= 5; // near start
              if (page >= totalPages - 2) return pageNum >= totalPages - 4; // near end
              return Math.abs(pageNum - page) <= 2; // middle
            })
            .map((pageNum) => (
              <button
                key={pageNum}
                onClick={() => setPage(pageNum)}
                className={`px-4 py-2 rounded-full ${
                  page === pageNum
                    ? "bg-blue-200 text-blue-500"
                    : "bg-white text-gray-500 hover:bg-gray-100"
                }`}
              >
                {pageNum}
              </button>
            ))}

          <Button
            icon="pi pi-angle-right"
            onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
            disabled={page === totalPages}
            className="p-button-rounded p-button-text"
          />
        </div>
      </div>
    </div>
  );
}
