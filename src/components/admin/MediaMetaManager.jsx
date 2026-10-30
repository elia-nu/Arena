import { useMemo, useState } from "react";
import { FaEdit, FaPlus, FaSave, FaTrash, FaTimes } from "react-icons/fa";
import { mediaAPI } from "../../services/api";

const slugifyCategoryValue = (value) => {
  return value
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
};

const formatCategoryLabel = (value) => {
  const cleaned = (value || "").toString().replace(/-/g, " ");
  return cleaned.replace(/\b\w/g, (c) => c.toUpperCase());
};

const MediaMetaManager = ({ themes = [], categories = [], onRefresh }) => {
  const [activeTab, setActiveTab] = useState("themes");

  const [newThemeValue, setNewThemeValue] = useState("");
  const [newCategoryValue, setNewCategoryValue] = useState("");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const [editingThemeId, setEditingThemeId] = useState(null);
  const [editingThemeValue, setEditingThemeValue] = useState("");

  const [editingCategoryId, setEditingCategoryId] = useState(null);
  const [editingCategoryValue, setEditingCategoryValue] = useState("");

  const reservedCategoryValue = useMemo(() => "other", []);

  const resetError = () => setError(null);

  const handleAddTheme = async (e) => {
    e.preventDefault();
    resetError();
    setSaving(true);
    try {
      await mediaAPI.createTheme({ value: newThemeValue });
      setNewThemeValue("");
      onRefresh?.();
    } catch (err) {
      setError(err?.message || "Failed to add theme.");
    } finally {
      setSaving(false);
    }
  };

  const handleAddCategory = async (e) => {
    e.preventDefault();
    resetError();
    setSaving(true);
    try {
      const normalized = slugifyCategoryValue(newCategoryValue);
      await mediaAPI.createCategory({ value: normalized });
      setNewCategoryValue("");
      onRefresh?.();
    } catch (err) {
      setError(err?.message || "Failed to add category.");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateTheme = async () => {
    resetError();
    if (!editingThemeId) return;
    setSaving(true);
    try {
      await mediaAPI.updateTheme(editingThemeId, { value: editingThemeValue });
      setEditingThemeId(null);
      setEditingThemeValue("");
      onRefresh?.();
    } catch (err) {
      setError(err?.message || "Failed to update theme.");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateCategory = async () => {
    resetError();
    if (!editingCategoryId) return;
    setSaving(true);
    try {
      const normalized = slugifyCategoryValue(editingCategoryValue);
      await mediaAPI.updateCategory(editingCategoryId, { value: normalized });
      setEditingCategoryId(null);
      setEditingCategoryValue("");
      onRefresh?.();
    } catch (err) {
      setError(err?.message || "Failed to update category.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTheme = async (id) => {
    resetError();
    if (!window.confirm("Delete this theme? Existing media will be cleared.")) {
      return;
    }
    setSaving(true);
    try {
      await mediaAPI.deleteTheme(id);
      onRefresh?.();
    } catch (err) {
      setError(err?.message || "Failed to delete theme.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCategory = async (id, value) => {
    resetError();
    if (value === reservedCategoryValue) {
      setError('Cannot delete the default category "other".');
      return;
    }

    if (
      !window.confirm(
        "Delete this category? Existing media will be moved to 'other'.",
      )
    ) {
      return;
    }

    setSaving(true);
    try {
      await mediaAPI.deleteCategory(id);
      onRefresh?.();
    } catch (err) {
      setError(err?.message || "Failed to delete category.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white border-2 border-primary-200 rounded-3xl p-6">
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-4">
        <div>
          <h3 className="text-2xl font-bold text-secondary-600">
            Media Themes & Categories
          </h3>
          <p className="text-primary-700 mt-1 text-sm">
            Keep dropdowns in sync with your Gallery content.
          </p>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setActiveTab("themes")}
            className={`px-4 py-2 rounded-full text-sm font-semibold border-2 transition ${
              activeTab === "themes"
                ? "bg-secondary-500 text-white border-secondary-500"
                : "bg-white text-primary-950 border-primary-200 hover:bg-primary-50"
            }`}
          >
            Themes
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("categories")}
            className={`px-4 py-2 rounded-full text-sm font-semibold border-2 transition ${
              activeTab === "categories"
                ? "bg-secondary-500 text-white border-secondary-500"
                : "bg-white text-primary-950 border-primary-200 hover:bg-primary-50"
            }`}
          >
            Categories
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 bg-red-500 text-white px-4 py-3 rounded-xl font-semibold">
          {error}
        </div>
      )}

      {activeTab === "themes" && (
        <div className="space-y-4">
          <form onSubmit={handleAddTheme} className="flex gap-3">
            <input
              type="text"
              value={newThemeValue}
              onChange={(e) => setNewThemeValue(e.target.value)}
              placeholder="e.g., Rivalry"
              className="flex-1 rounded-xl border-2 border-primary-200 bg-white px-4 py-2"
              disabled={saving}
              required
            />
            <button
              type="submit"
              disabled={saving}
              className="bg-secondary-500 text-white px-4 py-2 rounded-xl font-semibold hover:bg-secondary-600 transition flex items-center gap-2"
            >
              <FaPlus /> Add
            </button>
          </form>

          <div className="space-y-2">
            {themes.map((theme) => (
              <div
                key={theme._id}
                className="flex items-center justify-between gap-3 bg-primary-50/30 border-2 border-primary-200 rounded-2xl px-4 py-3"
              >
                {editingThemeId === theme._id ? (
                  <div className="flex items-center gap-2 w-full">
                    <input
                      type="text"
                      value={editingThemeValue}
                      onChange={(e) => setEditingThemeValue(e.target.value)}
                      className="flex-1 rounded-xl border-2 border-primary-200 bg-white px-4 py-2"
                      disabled={saving}
                    />
                    <button
                      type="button"
                      onClick={handleUpdateTheme}
                      disabled={saving}
                      className="bg-blue-500 text-white px-3 py-2 rounded-xl font-semibold hover:bg-blue-600 transition"
                      title="Save theme"
                    >
                      <FaSave />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingThemeId(null);
                        setEditingThemeValue("");
                      }}
                      disabled={saving}
                      className="bg-white text-primary-950 border-2 border-primary-200 px-3 py-2 rounded-xl font-semibold hover:bg-primary-50 transition"
                      title="Cancel"
                    >
                      <FaTimes />
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="font-semibold text-secondary-600 truncate">
                        {theme.value}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingThemeId(theme._id);
                          setEditingThemeValue(theme.value);
                          resetError();
                        }}
                        disabled={saving}
                        className="bg-white text-primary-950 border-2 border-primary-200 px-3 py-2 rounded-xl font-semibold hover:bg-primary-50 transition"
                        title="Edit theme"
                      >
                        <FaEdit />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteTheme(theme._id)}
                        disabled={saving}
                        className="bg-red-500 text-white px-3 py-2 rounded-xl font-semibold hover:bg-red-600 transition"
                        title="Delete theme"
                      >
                        <FaTrash />
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}

            {themes.length === 0 && (
              <div className="text-primary-700 text-sm">No themes found.</div>
            )}
          </div>
        </div>
      )}

      {activeTab === "categories" && (
        <div className="space-y-4">
          <form onSubmit={handleAddCategory} className="flex gap-3">
            <input
              type="text"
              value={newCategoryValue}
              onChange={(e) => setNewCategoryValue(e.target.value)}
              placeholder="e.g., women-highlights"
              className="flex-1 rounded-xl border-2 border-primary-200 bg-white px-4 py-2"
              disabled={saving}
              required
            />
            <button
              type="submit"
              disabled={saving}
              className="bg-secondary-500 text-white px-4 py-2 rounded-xl font-semibold hover:bg-secondary-600 transition flex items-center gap-2"
            >
              <FaPlus /> Add
            </button>
          </form>

          <div className="space-y-2">
            {categories.map((category) => (
              <div
                key={category._id}
                className="flex items-center justify-between gap-3 bg-primary-50/30 border-2 border-primary-200 rounded-2xl px-4 py-3"
              >
                {editingCategoryId === category._id ? (
                  <div className="flex items-center gap-2 w-full">
                    <input
                      type="text"
                      value={editingCategoryValue}
                      onChange={(e) => setEditingCategoryValue(e.target.value)}
                      className="flex-1 rounded-xl border-2 border-primary-200 bg-white px-4 py-2"
                      disabled={saving}
                    />
                    <button
                      type="button"
                      onClick={handleUpdateCategory}
                      disabled={saving}
                      className="bg-blue-500 text-white px-3 py-2 rounded-xl font-semibold hover:bg-blue-600 transition"
                      title="Save category"
                    >
                      <FaSave />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingCategoryId(null);
                        setEditingCategoryValue("");
                      }}
                      disabled={saving}
                      className="bg-white text-primary-950 border-2 border-primary-200 px-3 py-2 rounded-xl font-semibold hover:bg-primary-50 transition"
                      title="Cancel"
                    >
                      <FaTimes />
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="font-semibold text-secondary-600 truncate">
                        {formatCategoryLabel(category.value)}
                      </span>
                      <span className="text-xs text-primary-700 bg-primary-100 px-2 py-1 rounded-full whitespace-nowrap">
                        {category.value}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingCategoryId(category._id);
                          setEditingCategoryValue(category.value);
                          resetError();
                        }}
                        disabled={saving}
                        className="bg-white text-primary-950 border-2 border-primary-200 px-3 py-2 rounded-xl font-semibold hover:bg-primary-50 transition"
                        title="Edit category"
                      >
                        <FaEdit />
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          handleDeleteCategory(category._id, category.value)
                        }
                        disabled={saving}
                        className={`px-3 py-2 rounded-xl font-semibold transition ${
                          category.value === reservedCategoryValue
                            ? "bg-primary-100 text-primary-700 cursor-not-allowed"
                            : "bg-red-500 text-white hover:bg-red-600"
                        }`}
                        title={
                          category.value === reservedCategoryValue
                            ? "Default category"
                            : "Delete category"
                        }
                      >
                        <FaTrash />
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}

            {categories.length === 0 && (
              <div className="text-primary-700 text-sm">
                No categories found.
              </div>
            )}
          </div>
        </div>
      )}

      <div className="mt-6 text-xs text-primary-600/80">
        Tip: renaming a category or theme will update existing media items
        automatically.
      </div>
    </div>
  );
};

export default MediaMetaManager;
