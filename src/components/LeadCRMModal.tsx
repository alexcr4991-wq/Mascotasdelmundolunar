import React, { useState } from 'react';
import { User, Dog, Cat, History, MessageSquare, Save, X } from 'lucide-react';
import { CustomerLead, Product, OrderItemSummary } from '../types';

interface LeadCRMModalProps {
  lead: CustomerLead;
  onClose: () => void;
  onUpdateLead: (updatedLead: CustomerLead) => void;
}

export const LeadCRMModal: React.FC<LeadCRMModalProps> = ({ lead, onClose, onUpdateLead }) => {
  const [formData, setFormData] = useState<CustomerLead>({ ...lead });

  const handleSave = () => {
    onUpdateLead(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-[#1C2722] flex items-center gap-2">
            <User className="w-5 h-5 text-amber-500" />
            Perfil de Cliente: {formData.name}
          </h2>
          <button onClick={onClose}><X className="w-6 h-6 text-neutral-400" /></button>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <input className="border p-2 rounded-lg" placeholder="Nombre Mascota" value={formData.petName || ''} onChange={e => setFormData({...formData, petName: e.target.value})} />
          <select className="border p-2 rounded-lg" value={formData.petType || 'perro'} onChange={e => setFormData({...formData, petType: e.target.value as any})}>
            <option value="perro">Perro</option>
            <option value="gato">Gato</option>
            <option value="ambos">Ambos</option>
          </select>
          <input className="border p-2 rounded-lg" placeholder="Raza" value={formData.petBreed || ''} onChange={e => setFormData({...formData, petBreed: e.target.value})} />
          <input className="border p-2 rounded-lg" placeholder="Edad" value={formData.petAge || ''} onChange={e => setFormData({...formData, petAge: e.target.value})} />
        </div>

        <div className="mb-6">
          <h3 className="font-bold mb-2 flex items-center gap-2"><History className="w-4 h-4 text-amber-500" /> Historial de Compras</h3>
          {formData.purchaseHistory && formData.purchaseHistory.length > 0 ? (
            <ul className="space-y-2">
              {formData.purchaseHistory.map((item, idx) => (
                <li key={idx} className="bg-neutral-50 p-2 rounded text-sm">{item.productName} - ${item.total}</li>
              ))}
            </ul>
          ) : <p className="text-sm text-neutral-500">Sin historial aún</p>}
        </div>

        <textarea className="w-full border p-2 rounded-lg mb-4" placeholder="Notas sobre el cliente" rows={4} value={formData.notes || ''} onChange={e => setFormData({...formData, notes: e.target.value})} />
        
        <button onClick={handleSave} className="w-full bg-[#1C2722] text-white p-3 rounded-xl font-bold flex items-center justify-center gap-2">
          <Save className="w-4 h-4" /> Guardar Perfil CRM
        </button>
      </div>
    </div>
  );
};
