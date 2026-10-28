import { useEffect, useState } from "react";
import API from "./api";
import "./App.css";

function App() {
  // =========================
  // STATE DATA
  // =========================
  const [warehouses, setWarehouses] = useState([]);
  const [products, setProducts] = useState([]);
  const [inventories, setInventories] = useState([]);
  const [mutations, setMutations] = useState([]);

  // State untuk melacak ID gudang yang sedang diedit (null jika mode tambah)
  const [editingWarehouseId, setEditingWarehouseId] = useState(null);
  // state untuk melacak produk yang sedang diedit (null jika mode tambah)
  const [editingProductId, setEditingProductId] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [mutationMessage, setMutationMessage] = useState("");

  // =========================
  // STATE FORM GUDANG
  // =========================
  const [showWarehouseForm, setShowWarehouseForm] = useState(false);

  const [warehouseForm, setWarehouseForm] = useState({
    code: "",
    name: "",
    address: "",
  });

  // =========================
  // STATE FORM PRODUK
  // =========================
  const [showProductForm, setShowProductForm] = useState(false);

  const [productForm, setProductForm] = useState({
    sku: "",
    name: "",
    category: "",
    unit: "pcs",
    description: "",
  });

  // =========================
  // STATE FORM INVENTARIS
  // =========================
  const [showInventoryForm, setShowInventoryForm] = useState(false);

  const [inventoryForm, setInventoryForm] = useState({
    warehouse_id: "",
    product_id: "",
    quantity: 0,
    reorder_level: 10,
  });

  // =========================
  // STATE FORM MUTASI STOK
  // =========================
  const [showMutationForm, setShowMutationForm] = useState(false);

  const [mutationForm, setMutationForm] = useState({
    warehouse_id: "",
    product_id: "",
    type: "in",
    quantity: 1,
    notes: "",
  });

  // =========================
  // MENGAMBIL DATA DARI LARAVEL
  // =========================
  const loadData = async () => {
    try {
      const [
        warehouseResponse,
        productResponse,
        inventoryResponse,
        mutationResponse,
      ] = await Promise.all([
        API.get("/warehouses"),
        API.get("/products"),
        API.get("/inventories"),
        API.get("/stock-mutations"),
      ]);

      setWarehouses(warehouseResponse.data);
      setProducts(productResponse.data);
      setInventories(inventoryResponse.data);
      setMutations(mutationResponse.data);

      setError("");
    } catch (err) {
      console.error(err);
      setError(
        err.response?.data?.message ||
          "Gagal mengambil data. Pastikan server Laravel aktif.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // =========================
  // FUNGSI EDIT & BATAL GUDANG
  // =========================
  const handleEditWarehouse = (warehouse) => {
    setEditingWarehouseId(warehouse.id);

    setWarehouseForm({
      code: warehouse.code,
      name: warehouse.name,
      address: warehouse.address || "",
    });

    setShowWarehouseForm(true);
  };

  const handleCancelWarehouse = () => {
    setEditingWarehouseId(null);
    setWarehouseForm({
      code: "",
      name: "",
      address: "",
    });
    setShowWarehouseForm(false);
  };

  // =========================
  // MENYIMPAN / MEMPERBARUI GUDANG
  // =========================
  const handleWarehouseSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      if (editingWarehouseId) {
        // Mode Edit (PUT)
        await API.put(`/warehouses/${editingWarehouseId}`, warehouseForm);
      } else {
        // Mode Tambah Baru (POST)
        await API.post("/warehouses", warehouseForm);
      }

      // Reset form dan status edit
      handleCancelWarehouse();

      // Refresh data dari database
      await loadData();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Gagal menyimpan data gudang.");
    }
  };
  // =========================
  // MENGHAPUS GUDANG
  // =========================
  const handleDeleteWarehouse = async (id) => {
    // 1. Tanya konfirmasi ke user dulu
    const confirmed = window.confirm(
      "Apakah Anda yakin ingin menghapus gudang ini?",
    );
    if (!confirmed) return; // Jika klik Cancel, berhenti di sini

    setError("");

    try {
      // 2. Kirim request DELETE ke backend Laravel
      await API.delete(`/warehouses/${id}`);

      // 3. Ambil ulang data agar tabel otomatis ter-update
      await loadData();
    } catch (err) {
      console.error(err);
      // Tangkap pesan error dari backend
      // (misal: "Gudang memiliki riwayat stok dan tidak dapat dihapus.")
      setError(err.response?.data?.message || "Gagal menghapus data gudang.");
    }
  };

  // =========================
  // fungsi edit di produk
  // =========================
  const handleEditProduct = (product) => {
    setEditingProductId(product.id);

    setProductForm({
      sku: product.sku,
      name: product.name,
      category: product.category || "",
      unit: product.unit,
      description: product.description || "",
    });

    setShowProductForm(true);
  };

  const handleCancelProduct = () => {
    setEditingProductId(null);

    setProductForm({
      sku: "",
      name: "",
      category: "",
      unit: "pcs",
      description: "",
    });

    setShowProductForm(false);
  };

  // =========================
  // menyimpan atau memperbarui product
  // =========================
  const handleProductSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      if (editingProductId) {
        // Mode Edit (PUT)
        await API.put(`/products/${editingProductId}`, productForm);
      } else {
        // Mode Tambah Baru (POST)
        await API.post("/products", productForm);
      }

      // Reset form dan status edit
      handleCancelProduct();

      // Refresh data dari database
      await loadData();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Gagal menyimpan data produk.");
    }
  };

  
  // =========================
  // TOMBOL HAPUS DI PRODUK
  // =========================
  const handleDeleteProduct = async (id) => {
    // 1. Tanya konfirmasi ke user dulu
    const confirmed = window.confirm(
      "Apakah Anda yakin ingin menghapus produk ini?",
    );
    if (!confirmed) return; // Jika klik Cancel, berhenti di sini

    setError("");
    
    try {
      // 2. Kirim request DELETE ke backend Laravel
      await API.delete(`/products/${id}`);

      // 3. Ambil ulang data agar tabel otomatis ter-update
      await loadData();
    } catch (err) {
      console.error(err);
      // Tangkap pesan error dari backend
      setError(err.response?.data?.message || "Gagal menghapus data produk.");
    }
  }

  // =========================
  // MENAMBAHKAN INVENTARIS
  // =========================
  const handleInventorySubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      await API.post("/inventories", {
        ...inventoryForm,
        warehouse_id: Number(inventoryForm.warehouse_id),
        product_id: Number(inventoryForm.product_id),
        quantity: Number(inventoryForm.quantity),
        reorder_level: Number(inventoryForm.reorder_level),
      });

      setInventoryForm({
        warehouse_id: "",
        product_id: "",
        quantity: 0,
        reorder_level: 10,
      });

      setShowInventoryForm(false);

      await loadData();
    } catch (err) {
      console.error(err);

      setError(err.response?.data?.message || "Gagal menambahkan inventaris.");
    }
  };

  // =========================
  // BARANG MASUK DAN KELUAR
  // =========================
  const handleMutationSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setMutationMessage("");

    try {
      const response = await API.post("/stock-mutations", {
        ...mutationForm,
        warehouse_id: Number(mutationForm.warehouse_id),
        product_id: Number(mutationForm.product_id),
        quantity: Number(mutationForm.quantity),
      });

      setMutationMessage(
        response.data.message || "Mutasi stok berhasil disimpan.",
      );

      setMutationForm({
        warehouse_id: "",
        product_id: "",
        type: "in",
        quantity: 1,
        notes: "",
      });

      setShowMutationForm(false);

      // Memperbarui stok dan riwayat dari database
      await loadData();
    } catch (err) {
      console.error(err);

      setError(err.response?.data?.message || "Gagal menyimpan mutasi stok.");
    }
  };

  // =========================
  // FORMAT TANGGAL
  // =========================
  const formatDate = (date) => {
    if (!date) return "-";

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return "-";
    }

    return parsedDate.toLocaleString("id-ID", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  return (
    <main className="dashboard">
      {/* HEADER */}
      <header className="dashboard-header">
        <div>
          <p className="eyebrow">WAREHOUSE MANAGEMENT</p>
          <h1>Mini WMS</h1>
          <p className="subtitle">Dashboard manajemen gudang dan inventaris</p>
        </div>

        <span className="status-badge">● API Connection</span>
      </header>

      {/* RINGKASAN DATA */}
      <section className="summary-grid">
        <article className="summary-card">
          <p>Total Gudang</p>
          <h2>{warehouses.length}</h2>
        </article>

        <article className="summary-card">
          <p>Total Produk</p>
          <h2>{products.length}</h2>
        </article>

        <article className="summary-card">
          <p>Total Jenis Inventaris</p>
          <h2>{inventories.length}</h2>
        </article>

        <article className="summary-card">
          <p>Total Mutasi Stok</p>
          <h2>{mutations.length}</h2>
        </article>
      </section>

      {/* STATUS LOADING */}
      {loading && <p>Memuat data dari Laravel...</p>}

      {/* PESAN ERROR */}
      {error && (
        <p className="error-message" role="alert">
          {error}
        </p>
      )}

      {!loading && (
        <section className="data-grid">
          {/* =========================
              DAFTAR GUDANG
          ========================= */}
          <article className="data-card">
            <div className="section-heading">
              <h2>Daftar Gudang</h2>

              <button
                type="button"
                className="add-button"
                onClick={() => {
                  if (showWarehouseForm) {
                    handleCancelWarehouse();
                  } else {
                    setShowWarehouseForm(true);
                  }
                }}
              >
                {showWarehouseForm ? "Tutup Form" : "+ Tambah Gudang"}
              </button>
            </div>

            {showWarehouseForm && (
              <form className="data-form" onSubmit={handleWarehouseSubmit}>
                <h3>
                  {editingWarehouseId
                    ? "Edit Data Gudang"
                    : "Tambah Gudang Baru"}
                </h3>

                <label>
                  Kode Gudang
                  <input
                    type="text"
                    value={warehouseForm.code}
                    onChange={(e) =>
                      setWarehouseForm({
                        ...warehouseForm,
                        code: e.target.value,
                      })
                    }
                    placeholder="GDG-JKT-01"
                    required
                  />
                </label>

                <label>
                  Nama Gudang
                  <input
                    type="text"
                    value={warehouseForm.name}
                    onChange={(e) =>
                      setWarehouseForm({
                        ...warehouseForm,
                        name: e.target.value,
                      })
                    }
                    placeholder="Gudang Jakarta"
                    required
                  />
                </label>

                <label>
                  Alamat
                  <textarea
                    value={warehouseForm.address}
                    onChange={(e) =>
                      setWarehouseForm({
                        ...warehouseForm,
                        address: e.target.value,
                      })
                    }
                    placeholder="Alamat gudang"
                  />
                </label>

                <div style={{ display: "flex", gap: "8px" }}>
                  <button type="submit" className="add-button">
                    {editingWarehouseId ? "Perbarui Gudang" : "Simpan Gudang"}
                  </button>
                  {editingWarehouseId && (
                    <button
                      type="button"
                      className="add-button"
                      style={{ background: "#6b7280" }}
                      onClick={handleCancelWarehouse}
                    >
                      Batal
                    </button>
                  )}
                </div>
              </form>
            )}

            {warehouses.length === 0 ? (
              <p className="empty-state">Belum ada data gudang.</p>
            ) : (
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>Kode</th>
                      <th>Nama Gudang</th>
                      <th>Status</th>
                      <th>Aksi</th>
                    </tr>
                  </thead>

                  <tbody>
                    {warehouses.map((warehouse) => (
                      <tr key={warehouse.id}>
                        <td>{warehouse.code}</td>
                        <td>{warehouse.name}</td>
                        <td>{warehouse.is_active ? "Aktif" : "Nonaktif"}</td>
                        <td>
                          {/* Gabungkan tombol Edit & Hapus di dalam flex container */}
                          <div style={{ display: "flex", gap: "6px" }}>
                            <button
                              type="button"
                              className="add-button"
                              style={{
                                padding: "4px 10px",
                                fontSize: "0.85rem",
                              }}
                              onClick={() => handleEditWarehouse(warehouse)}
                            >
                              Edit
                            </button>

                            <button
                              type="button"
                              className="add-button"
                              style={{
                                padding: "4px 10px",
                                fontSize: "0.85rem",
                                background: "#ef4444", // Warna merah
                              }}
                              onClick={() =>
                                handleDeleteWarehouse(warehouse.id)
                              }
                            >
                              Hapus
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </article>

          {/* =========================
              DAFTAR PRODUK
          ========================= */}
          <article className="data-card">
            <div className="section-heading">
              <h2>Daftar Produk</h2>

              <button
                type="button"
                className="add-button"
                onClick={() => setShowProductForm(!showProductForm)}
              >
                {showProductForm ? "Batal" : "+ Tambah Produk"}
              </button>
            </div>

            {showProductForm && (
              <form className="data-form" onSubmit={handleProductSubmit}>
                <h3>
                  {editingProductId ? "Edit Data Produk" : "Tambah Produk Baru"}
                </h3>
                <label>
                  SKU / Kode Produk
                  <input
                    type="text"
                    value={productForm.sku}
                    onChange={(e) =>
                      setProductForm({
                        ...productForm,
                        sku: e.target.value,
                      })
                    }
                    placeholder="PRD-001"
                    required
                  />
                </label>

                <label>
                  Nama Produk
                  <input
                    type="text"
                    value={productForm.name}
                    onChange={(e) =>
                      setProductForm({
                        ...productForm,
                        name: e.target.value,
                      })
                    }
                    placeholder="Beras Premium"
                    required
                  />
                </label>

                <label>
                  Kategori
                  <input
                    type="text"
                    value={productForm.category}
                    onChange={(e) =>
                      setProductForm({
                        ...productForm,
                        category: e.target.value,
                      })
                    }
                    placeholder="Bahan Baku"
                  />
                </label>

                <label>
                  Satuan
                  <select
                    value={productForm.unit}
                    onChange={(e) =>
                      setProductForm({
                        ...productForm,
                        unit: e.target.value,
                      })
                    }
                    required
                  >
                    <option value="pcs">pcs</option>
                    <option value="kg">kg</option>
                    <option value="gram">gram</option>
                    <option value="liter">liter</option>
                    <option value="box">box</option>
                    <option value="dus">dus</option>
                    <option value="pack">pack</option>
                  </select>
                </label>

                <label>
                  Deskripsi
                  <textarea
                    value={productForm.description}
                    onChange={(e) =>
                      setProductForm({
                        ...productForm,
                        description: e.target.value,
                      })
                    }
                    placeholder="Deskripsi produk (opsional)"
                  />
                </label>
                <div style={{ display: "flex", gap: "8px" }}>
                  <button type="submit" className="add-button">
                    {editingProductId ? "Perbarui Produk" : "Simpan Produk"}
                  </button>
                  {editingProductId && (
                    <button
                      type="button"
                      className="add-button"
                      style={{ background: "#6b7280" }}
                      onClick={handleCancelProduct}
                    >
                      Batal
                    </button>
                  )}
                </div>
              </form>
            )}

            {products.length === 0 ? (
              <p className="empty-state">Belum ada data produk.</p>
            ) : (
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>SKU</th>
                      <th>Nama Produk</th>
                      <th>Kategori</th>
                      <th>Satuan</th>
                      <th>Aksi</th>
                    </tr>
                  </thead>

                  <tbody>
                    {products.map((product) => (
                      <tr key={product.id}>
                        <td>{product.sku}</td>
                        <td>{product.name}</td>
                        <td>{product.category || "-"}</td>
                        <td>{product.unit}</td>
                        <td>
                          <div style={{ display: "flex", gap: "6px" }}>
                            <button
                              type="button"
                              className="add-button"
                              style={{
                                padding: "4px 10px",
                                fontSize: "0.85rem",
                              }}
                              onClick={() => handleEditProduct(product)}
                            >
                              Edit
                            </button>

                            <button
                              type="button"
                              className="add-button"
                              style={{
                                padding: "4px 10px",
                                fontSize: "0.85rem",
                                background: "#ef4444", // Warna merah
                              }}
                              onClick={() => handleDeleteProduct(product.id)}
                            >
                              Hapus
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </article>

          {/* =========================
              STOK INVENTARIS
          ========================= */}
          <article className="data-card inventory-card">
            <div className="section-heading">
              <h2>Stok Inventaris</h2>

              <button
                type="button"
                className="add-button"
                onClick={() => setShowInventoryForm(!showInventoryForm)}
              >
                {showInventoryForm ? "Batal" : "+ Tambah Stok"}
              </button>
            </div>

            <p className="subtitle">
              Jumlah stok setiap produk di masing-masing gudang.
            </p>

            {showInventoryForm && (
              <form className="data-form" onSubmit={handleInventorySubmit}>
                <label>
                  Pilih Gudang
                  <select
                    value={inventoryForm.warehouse_id}
                    onChange={(e) =>
                      setInventoryForm({
                        ...inventoryForm,
                        warehouse_id: e.target.value,
                      })
                    }
                    required
                  >
                    <option value="">-- Pilih Gudang --</option>

                    {warehouses.map((warehouse) => (
                      <option key={warehouse.id} value={warehouse.id}>
                        {warehouse.code} - {warehouse.name}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  Pilih Produk
                  <select
                    value={inventoryForm.product_id}
                    onChange={(e) =>
                      setInventoryForm({
                        ...inventoryForm,
                        product_id: e.target.value,
                      })
                    }
                    required
                  >
                    <option value="">-- Pilih Produk --</option>

                    {products.map((product) => (
                      <option key={product.id} value={product.id}>
                        {product.sku} - {product.name}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  Jumlah Stok Awal
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={inventoryForm.quantity}
                    onChange={(e) =>
                      setInventoryForm({
                        ...inventoryForm,
                        quantity: e.target.value,
                      })
                    }
                    required
                  />
                </label>

                <label>
                  Minimum Stok
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={inventoryForm.reorder_level}
                    onChange={(e) =>
                      setInventoryForm({
                        ...inventoryForm,
                        reorder_level: e.target.value,
                      })
                    }
                    required
                  />
                </label>

                <button type="submit" className="add-button">
                  Simpan Stok
                </button>
              </form>
            )}

            {inventories.length === 0 ? (
              <p className="empty-state">
                Belum ada data inventaris. Tambahkan stok awal untuk mulai
                mengelola persediaan.
              </p>
            ) : (
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>Gudang</th>
                      <th>SKU</th>
                      <th>Nama Produk</th>
                      <th>Stok</th>
                      <th>Minimum Stok</th>
                      <th>Status</th>
                    </tr>
                  </thead>

                  <tbody>
                    {inventories.map((inventory) => (
                      <tr key={inventory.id}>
                        <td>{inventory.warehouse?.name || "-"}</td>
                        <td>{inventory.product?.sku || "-"}</td>
                        <td>{inventory.product?.name || "-"}</td>
                        <td>
                          {inventory.quantity} {inventory.product?.unit || ""}
                        </td>
                        <td>
                          {inventory.reorder_level}{" "}
                          {inventory.product?.unit || ""}
                        </td>
                        <td>
                          {inventory.quantity <= inventory.reorder_level
                            ? "Stok Menipis"
                            : "Stok Aman"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </article>

          {/* =========================
              MUTASI BARANG
          ========================= */}
          <article className="data-card inventory-card">
            <div className="section-heading">
              <h2>Barang Masuk & Keluar</h2>

              <button
                type="button"
                className="add-button"
                onClick={() => {
                  setShowMutationForm(!showMutationForm);
                  setMutationMessage("");
                  setError("");
                }}
              >
                {showMutationForm ? "Batal" : "+ Catat Mutasi"}
              </button>
            </div>

            <p className="subtitle">
              Catat penambahan atau pengurangan stok barang di gudang.
            </p>

            {mutationMessage && (
              <p className="success-message" role="status">
                {mutationMessage}
              </p>
            )}

            {showMutationForm && (
              <form className="data-form" onSubmit={handleMutationSubmit}>
                <label>
                  Pilih Gudang
                  <select
                    value={mutationForm.warehouse_id}
                    onChange={(e) =>
                      setMutationForm({
                        ...mutationForm,
                        warehouse_id: e.target.value,
                      })
                    }
                    required
                  >
                    <option value="">-- Pilih Gudang --</option>

                    {warehouses.map((warehouse) => (
                      <option key={warehouse.id} value={warehouse.id}>
                        {warehouse.code} - {warehouse.name}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  Pilih Produk
                  <select
                    value={mutationForm.product_id}
                    onChange={(e) =>
                      setMutationForm({
                        ...mutationForm,
                        product_id: e.target.value,
                      })
                    }
                    required
                  >
                    <option value="">-- Pilih Produk --</option>

                    {products.map((product) => (
                      <option key={product.id} value={product.id}>
                        {product.sku} - {product.name}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  Jenis Mutasi
                  <select
                    value={mutationForm.type}
                    onChange={(e) =>
                      setMutationForm({
                        ...mutationForm,
                        type: e.target.value,
                      })
                    }
                    required
                  >
                    <option value="in">Barang Masuk</option>
                    <option value="out">Barang Keluar</option>
                  </select>
                </label>

                <label>
                  Jumlah Barang
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={mutationForm.quantity}
                    onChange={(e) =>
                      setMutationForm({
                        ...mutationForm,
                        quantity: e.target.value,
                      })
                    }
                    required
                  />
                </label>

                <label>
                  Catatan
                  <textarea
                    value={mutationForm.notes}
                    onChange={(e) =>
                      setMutationForm({
                        ...mutationForm,
                        notes: e.target.value,
                      })
                    }
                    placeholder="Contoh: Pembelian stok dari supplier"
                  />
                </label>

                <button type="submit" className="add-button">
                  Simpan Mutasi Stok
                </button>
              </form>
            )}
          </article>

          {/* =========================
              RIWAYAT MUTASI STOK
          ========================= */}
          <article className="data-card inventory-card">
            <div className="section-heading">
              <h2>Riwayat Mutasi Stok</h2>
            </div>

            <p className="subtitle">
              Catatan barang masuk dan keluar yang sudah tersimpan.
            </p>

            {mutations.length === 0 ? (
              <p className="empty-state">Belum ada riwayat mutasi stok.</p>
            ) : (
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>Tanggal</th>
                      <th>Gudang</th>
                      <th>Produk</th>
                      <th>Jenis</th>
                      <th>Jumlah</th>
                      <th>Stok Sebelum</th>
                      <th>Stok Sesudah</th>
                      <th>Catatan</th>
                    </tr>
                  </thead>

                  <tbody>
                    {mutations.map((mutation) => (
                      <tr key={mutation.id}>
                        <td>{formatDate(mutation.created_at)}</td>

                        <td>{mutation.warehouse?.name || "-"}</td>

                        <td>
                          {mutation.product?.sku || "-"} -{" "}
                          {mutation.product?.name || "-"}
                        </td>

                        <td>
                          {mutation.type === "in"
                            ? "Barang Masuk"
                            : "Barang Keluar"}
                        </td>

                        <td>
                          {mutation.quantity} {mutation.product?.unit || ""}
                        </td>

                        <td>{mutation.stock_before}</td>

                        <td>{mutation.stock_after}</td>

                        <td>{mutation.notes || "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </article>
        </section>
      )}
    </main>
  );
}

export default App;
