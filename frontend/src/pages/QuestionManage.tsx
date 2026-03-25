import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { restrictToVerticalAxis, restrictToWindowEdges, restrictToParentElement } from '@dnd-kit/modifiers';

import {
  getAdminQuestions,
  createQuestion,
  updateQuestion,
  deleteQuestion,
  patchPublishQuestion,
  reorderQuestions,
  Question,
  QuestionCreate
} from '../services/api';

const CATEGORY_LABELS: Record<string, string> = {
  satisfaction: "満足度",
  relationship: "人間関係",
  health: "健康状態",
};

interface SortableRowProps {
  question: Question;
  onEdit: (q: Question) => void;
  onTogglePublish: (id: number, status: boolean) => void;
  onDelete: (id: number) => void;
}

const SortableRow: React.FC<SortableRowProps> = ({ question, onEdit, onTogglePublish, onDelete }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: question.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 1000 : 'auto',
    position: 'relative' as const,
    opacity: isDragging ? 0.5 : 1,
    backgroundColor: isDragging ? '#f9fafb' : 'transparent',
    boxShadow: isDragging ? '0 5px 15px rgba(0,0,0,0.1)' : 'none',
  };

  return (
    <tr
      ref={setNodeRef}
      style={style}
      className={`table-body-row ${isDragging ? 'dragging' : ''}`}
    >
      <td className="table-body-cell drag-handle" {...attributes} {...listeners}>
        <span style={{ cursor: 'grab', color: '#9ca3af', fontSize: '1.2rem' }}>⠿</span>
      </td>
      <td className="table-body-cell">
        <span className={`category-tag ${question.measurement_category}`}>
          {CATEGORY_LABELS[question.measurement_category]}
        </span>
      </td>
      <td className="table-body-cell">{question.text}</td>
      <td className="table-body-cell">
        <span className={`status-badge ${question.is_public ? 'public' : 'private'}`}>
          {question.is_public ? '公開中' : '非公開'}
        </span>
      </td>
      <td className="table-body-cell">
        <div className="table-actions">
          <button onClick={() => onEdit(question)} className="edit-button">編集</button>
          <button onClick={() => onTogglePublish(question.id, question.is_public)} className="toggle-publish-button">
            {question.is_public ? '非公開にする' : '公開にする'}
          </button>
          <button onClick={() => onDelete(question.id)} className="delete-button">削除</button>
        </div>
      </td>
    </tr>
  );
};

const QuestionManage: React.FC = () => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [formData, setFormData] = useState<QuestionCreate>({
    measurement_category: "satisfaction",
    text: "",
    is_public: true,
    sort_order: 0,
  });

  const dialogRef = useRef<HTMLDialogElement>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5, // 誤作動防止
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const fetchQuestions = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getAdminQuestions();
      setQuestions([...data].sort((a, b) => a.sort_order - b.sort_order));
      setError(null);
    } catch (err) {
      console.error('Failed to fetch questions:', err);
      setError('質問の取得に失敗しました。');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchQuestions();
  }, [fetchQuestions]);

  const openModal = (question?: Question) => {
    if (question) {
      setEditingQuestion(question);
      setFormData({
        measurement_category: question.measurement_category,
        text: question.text,
        is_public: question.is_public,
        sort_order: question.sort_order,
      });
    } else {
      setEditingQuestion(null);
      setFormData({
        measurement_category: "satisfaction",
        text: "",
        is_public: true,
        sort_order: questions.length,
      });
    }
    dialogRef.current?.showModal();
  };

  const closeModal = () => {
    dialogRef.current?.close();
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === dialogRef.current) closeModal();
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.text.trim()) return alert("質問内容を入力してください");

    setIsSaving(true);
    try {
      if (editingQuestion) {
        await updateQuestion(editingQuestion.id, formData);
      } else {
        await createQuestion(formData);
      }
      await fetchQuestions();
      closeModal();
    } catch (err) {
      alert("保存に失敗しました");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("本当に削除しますか？")) return;
    try {
      await deleteQuestion(id);
      await fetchQuestions();
    } catch (err) {
      alert("削除に失敗しました");
    }
  };

  const handleTogglePublish = async (id: number, currentStatus: boolean) => {
    try {
      await patchPublishQuestion(id, !currentStatus);
      setQuestions(prev => prev.map(q => q.id === id ? { ...q, is_public: !currentStatus } : q));
    } catch (err) {
      console.error('Failed to toggle publish:', err);
      alert('公開状態の切り替えに失敗しました。');
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = questions.findIndex((q) => q.id === active.id);
      const newIndex = questions.findIndex((q) => q.id === over.id);

      const newQuestions = arrayMove(questions, oldIndex, newIndex);
      const reorderedQuestions = newQuestions.map((q, idx) => ({ ...q, sort_order: idx }));

      setQuestions(reorderedQuestions);

      try {
        await reorderQuestions({
          orders: reorderedQuestions.map(q => ({ id: q.id, sort_order: q.sort_order }))
        });
      } catch (err) {
        console.error('Failed to reorder:', err);
        alert('並び替えの保存に失敗しました。');
        fetchQuestions();
      }
    }
  };

  const questionIds = useMemo(() => questions.map(q => q.id), [questions]);

  return (
    <div className="card-base dashboard-container">
      <div className="admin-header">
        <h2>質問管理画面</h2>
        <button className="add-button" onClick={() => openModal()}>
          質問を追加
        </button>
      </div>

      {error && <p className="alert-error">{error}</p>}

      <dialog ref={dialogRef} className="modal-container" onClick={handleBackdropClick}>
        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
          <h3>{editingQuestion ? "質問の編集" : "質問の追加"}</h3>
          <form onSubmit={handleSave}>
            <div className="form-group">
              <label>質問の内容</label>
              <input
                type="text"
                required
                value={formData.text}
                onChange={(e) => setFormData({ ...formData, text: e.target.value })}
                placeholder="例: 今日の体調はどうですか？"
              />
            </div>

            <div className="form-group">
              <label>カテゴリー</label>
              <select
                className="form-select"
                value={formData.measurement_category}
                onChange={(e) => setFormData({ ...formData, measurement_category: e.target.value })}
              >
                {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>公開設定</label>
              <select
                className="form-select"
                value={formData.is_public ? "true" : "false"}
                onChange={(e) => setFormData({ ...formData, is_public: e.target.value === "true" })}
              >
                <option value="true">公開</option>
                <option value="false">非公開</option>
              </select>
            </div>

            <div className="modal-actions">
              <button type="button" onClick={closeModal} className="modal-cancel-button" disabled={isSaving}>
                キャンセル
              </button>
              <button type="submit" className="modal-save-button" disabled={isSaving}>
                {isSaving ? "保存中..." : "保存する"}
              </button>
            </div>
          </form>
        </div>
      </dialog>

      {loading && questions.length === 0 ? (
        <p>読み込み中...</p>
      ) : questions.length === 0 ? (
        <p className="text-muted">質問が登録されていません。</p>
      ) : (
        <div className="table-container">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
            modifiers={[restrictToVerticalAxis, restrictToWindowEdges, restrictToParentElement]}
          >
            <table className="history-table">
              <thead>
                <tr className="table-header-row">
                  <th className="table-header-cell drag-handle" style={{ width: '40px' }}></th>
                  <th className="table-header-cell">カテゴリ</th>
                  <th className="table-header-cell">質問文</th>
                  <th className="table-header-cell is_public">公開</th>
                  <th className="table-header-cell actions">操作</th>
                </tr>
              </thead>
              <tbody>
                <SortableContext items={questionIds} strategy={verticalListSortingStrategy}>
                  {questions.map((question) => (
                    <SortableRow
                      key={question.id}
                      question={question}
                      onEdit={openModal}
                      onTogglePublish={handleTogglePublish}
                      onDelete={handleDelete}
                    />
                  ))}
                </SortableContext>
              </tbody>
            </table>
          </DndContext>
        </div>
      )}
    </div>
  );
};

export default QuestionManage;
