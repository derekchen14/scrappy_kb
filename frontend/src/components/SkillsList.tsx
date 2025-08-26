import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Skill, SkillCreate } from '../types';
import Modal from './Modal';
import { useAuthenticatedAPI } from '../hooks/useAuthenticatedAPI';
import { useAdmin } from '../hooks/useAdmin';

interface SkillsListProps {
  searchQuery?: string;
}

const skillCategories = ['Technical', 'Marketing', 'Business', 'Design', 'Sales', 'Product', 'Other'];

const SkillsList: React.FC<SkillsListProps> = ({ searchQuery = '' }) => {
  const { publicAPI, authenticatedAPI } = useAuthenticatedAPI();
  const { isAdmin } = useAdmin();

  const [skills, setSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [editingSkill, setEditingSkill] = useState<Skill | null>(null);
  const [selectedSkill, setSelectedSkill] = useState<Skill | null>(null);

  const [formData, setFormData] = useState<SkillCreate>({
    name: '',
    category: '',
    description: '',
  });

  const fetchSkills = useCallback(async () => {
    try {
      setLoading(true);
      setErr(null);
      const response = await publicAPI.get<Skill[]>('/skills/');
      setSkills(response.data);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error fetching skills:', error);
      setErr('Failed to load skills. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [publicAPI]);

  useEffect(() => {
    fetchSkills();
  }, [fetchSkills]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      alert('Name is required.');
      return;
    }

    try {
      if (editingSkill) {
        await authenticatedAPI.put(`/skills/${editingSkill.id}`, formData);
      } else {
        await authenticatedAPI.post('/skills/', formData);
      }
      await fetchSkills();
      resetForm();
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error saving skill:', error);
      setErr('Failed to save skill. Please try again.');
    }
  };

  const handleEdit = (skill: Skill) => {
    setEditingSkill(skill);
    setFormData({
      name: skill.name,
      category: skill.category || '',
      description: skill.description || '',
    });
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this skill?')) return;

    try {
      await authenticatedAPI.delete(`/skills/${id}`);
      await fetchSkills();
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error deleting skill:', error);
      setErr('Failed to delete skill. Please try again.');
    }
  };

  const resetForm = () => {
    setFormData({ name: '', category: '', description: '' });
    setEditingSkill(null);
    setShowForm(false);
  };

  const truncateDescription = (text: string, maxLength: number = 100): string =>
    text.length <= maxLength ? text : `${text.substring(0, maxLength)}…`;

  const filteredSkills = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return skills;

    return skills.filter((skill) => {
      const name = skill.name.toLowerCase();
      const category = skill.category?.toLowerCase() || '';
      const description = skill.description?.toLowerCase() || '';
      return name.includes(q) || category.includes(q) || description.includes(q);
    });
  }, [skills, searchQuery]);

  if (loading) {
    return (
      <div className="text-center py-12" aria-busy="true">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto" />
        <p className="text-gray-600 mt-4">Loading skills…</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-gray-900">Skills</h2>
        <button
          onClick={() => setShowForm(true)}
          disabled={!isAdmin}
          title={!isAdmin ? 'Only admins can add skills' : undefined}
          className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-md transition-colors"
        >
          Add Skill
        </button>
      </div>

      {err && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {err}
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <form onSubmit={handleSubmit} className="space-y-6">
              <h3 className="text-xl font-semibold text-gray-900">
                {editingSkill ? 'Edit Skill' : 'Add New Skill'}
              </h3>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="">Select a category</option>
                  {skillCategories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              <div className="flex justify-end space-x-4 pt-4">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!isAdmin}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-md transition-colors"
                >
                  {editingSkill ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6 gap-4">
        {filteredSkills.map((skill) => (
          <div
            key={skill.id}
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow"
          >
            <div className="space-y-2">
              <button onClick={() => setSelectedSkill(skill)} className="text-left w-full">
                <div className="flex items-center space-x-2 flex-wrap">
                  <h3 className="text-sm font-medium text-gray-900 hover:text-blue-600 transition-colors">
                    {skill.name}
                  </h3>
                  {skill.category && (
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-teal-100 text-teal-800">
                      {skill.category}
                    </span>
                  )}
                </div>
              </button>

              {skill.description && (
                <p className="text-xs text-gray-600">{truncateDescription(skill.description, 80)}</p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Skill Details Modal */}
      <Modal
        isOpen={selectedSkill !== null}
        onClose={() => setSelectedSkill(null)}
        title={selectedSkill?.name || ''}
      >
        {selectedSkill && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">{selectedSkill.name}</h3>

              {selectedSkill.category && (
                <div className="mb-4">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-teal-100 text-teal-800">
                    {selectedSkill.category}
                  </span>
                </div>
              )}

              {selectedSkill.description && (
                <p className="text-gray-700 mb-4">{selectedSkill.description}</p>
              )}
            </div>

            <div className="flex justify-end space-x-4 pt-4 border-t border-gray-200">
              {isAdmin && (
                <>
                  <button
                    onClick={() => {
                      setSelectedSkill(null);
                      handleEdit(selectedSkill);
                    }}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => {
                      setSelectedSkill(null);
                      handleDelete(selectedSkill.id);
                    }}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors"
                  >
                    Delete
                  </button>
                </>
              )}
              {!isAdmin && (
                <button
                  onClick={() => setSelectedSkill(null)}
                  className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-md transition-colors"
                >
                  Close
                </button>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default SkillsList;
