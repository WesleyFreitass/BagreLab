import React, { useState } from 'react';
import { Customer, SavedQuote } from '../lib/types';
import {
  Users,
  UserPlus,
  Phone,
  Mail,
  MapPin,
  Search,
  Edit2,
  Trash2,
  X,
  MessageSquare,
} from 'lucide-react';

interface CustomersTabProps {
  customers: Customer[];
  quotes: SavedQuote[];
  onSaveCustomer: (customer: Partial<Customer>) => Promise<any>;
  onDeleteCustomer: (id: string) => Promise<void>;
  onSelectCustomerForQuote?: (customer: Customer) => void;
}

export const CustomersTab: React.FC<CustomersTabProps> = ({
  customers,
  quotes,
  onSaveCustomer,
  onDeleteCustomer,
  onSelectCustomerForQuote,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Partial<Customer> | null>(null);

  // Filtered list
  const filteredCustomers = customers.filter((c) => {
    const term = searchTerm.toLowerCase();
    return (
      c.name.toLowerCase().includes(term) ||
      c.phone.toLowerCase().includes(term) ||
      (c.email && c.email.toLowerCase().includes(term)) ||
      (c.city && c.city.toLowerCase().includes(term))
    );
  });

  const handleOpenAdd = () => {
    setEditingCustomer({
      name: '',
      phone: '',
      email: '',
      document: '',
      city: '',
      state: '',
      address: '',
      notes: '',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (customer: Customer) => {
    setEditingCustomer({ ...customer });
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCustomer || !editingCustomer.name || !editingCustomer.phone) {
      alert('Nome e WhatsApp são obrigatórios.');
      return;
    }

    await onSaveCustomer(editingCustomer);
    setIsModalOpen(false);
    setEditingCustomer(null);
  };

  const handleOpenWhatsApp = (phone: string, name: string) => {
    let clean = phone.replace(/\D/g, '');
    if (clean.length === 10 || clean.length === 11) {
      clean = `55${clean}`;
    }
    const message = encodeURIComponent(`Olá ${name}! Tudo bem? Estou entrando em contato referente à sua solicitação de impressão 3D.`);
    window.open(`https://api.whatsapp.com/send?phone=${clean}&text=${message}`, '_blank');
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-2 rounded-lg bg-blue-50 text-blue-600">
              <Users className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Cadastro de Clientes</h2>
          </div>
          <p className="text-sm text-slate-500">
            Gerencie contatos para envio automático de orçamentos e propostas comerciais no WhatsApp
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm px-4 py-2.5 rounded-lg shadow-2xs transition-colors cursor-pointer"
        >
          <UserPlus className="w-4 h-4" />
          <span>Novo Cliente</span>
        </button>
      </div>

      {/* Search and Filters Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por nome, WhatsApp, e-mail ou cidade..."
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="text-xs text-slate-500 font-medium">
          Total: <strong className="text-slate-800">{customers.length}</strong> clientes cadastrados
        </div>
      </div>

      {/* Customers Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4">Cliente / Contato</th>
                <th className="py-3 px-4">WhatsApp</th>
                <th className="py-3 px-4">Localização / Documento</th>
                <th className="py-3 px-4 text-center">Orçamentos</th>
                <th className="py-3 px-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800">
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    <Users className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    <p className="font-medium text-sm">Nenhum cliente encontrado</p>
                    <p className="text-xs text-slate-400 mt-1">
                      {searchTerm ? 'Tente buscar com outros termos' : 'Cadastre seu primeiro cliente no botão acima'}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((customer) => {
                  const customerQuotes = quotes.filter(
                    (q) => q.customerId === customer.id || q.customerName.toLowerCase() === customer.name.toLowerCase()
                  );

                  return (
                    <tr key={customer.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-xs shrink-0">
                            {customer.name.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 block text-sm">{customer.name}</span>
                            {customer.email && (
                              <span className="text-slate-500 flex items-center gap-1 text-[11px] mt-0.5">
                                <Mail className="w-3 h-3 text-slate-400" />
                                {customer.email}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 font-mono font-medium">
                        <div className="flex items-center gap-2">
                          <span className="text-slate-800">{customer.phone}</span>
                          <button
                            onClick={() => handleOpenWhatsApp(customer.phone, customer.name)}
                            className="p-1 rounded bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors"
                            title="Abrir conversa no WhatsApp"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-slate-600">
                        <div>
                          {customer.city ? (
                            <span className="flex items-center gap-1 font-medium text-slate-700">
                              <MapPin className="w-3 h-3 text-slate-400" />
                              {customer.city}
                              {customer.state ? ` - ${customer.state}` : ''}
                            </span>
                          ) : (
                            <span className="text-slate-400 italic">Não informado</span>
                          )}
                          {customer.document && (
                            <span className="text-[11px] text-slate-400 block mt-0.5">
                              Doc: {customer.document}
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
                          {customerQuotes.length}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {onSelectCustomerForQuote && (
                            <button
                              onClick={() => onSelectCustomerForQuote(customer)}
                              className="px-2.5 py-1 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors"
                              title="Criar novo orçamento para este cliente"
                            >
                              Orçar
                            </button>
                          )}
                          <button
                            onClick={() => handleOpenEdit(customer)}
                            className="p-1.5 rounded-md text-slate-500 hover:text-blue-600 hover:bg-slate-100 transition-colors"
                            title="Editar Dados"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`Deseja realmente excluir o cliente "${customer.name}"?`)) {
                                onDeleteCustomer(customer.id);
                              }
                            }}
                            className="p-1.5 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                            title="Excluir"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Customer Modal */}
      {isModalOpen && editingCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-lg bg-blue-50 text-blue-600">
                  <UserPlus className="w-5 h-5" />
                </span>
                <h3 className="font-bold text-slate-900 text-base">
                  {editingCustomer.id ? 'Editar Dados do Cliente' : 'Novo Cadastro de Cliente'}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="text-slate-700 font-semibold block mb-1">
                    Nome Completo / Empresa *
                  </label>
                  <input
                    type="text"
                    required
                    value={editingCustomer.name || ''}
                    onChange={(e) => setEditingCustomer({ ...editingCustomer, name: e.target.value })}
                    placeholder="Ex: João da Silva / Maker Tech"
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="text-slate-700 font-semibold block mb-1">
                    WhatsApp (com DDD) *
                  </label>
                  <div className="relative">
                    <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={editingCustomer.phone || ''}
                      onChange={(e) => setEditingCustomer({ ...editingCustomer, phone: e.target.value })}
                      placeholder="11999998888"
                      className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <span className="text-[10px] text-slate-400 mt-0.5 block">Usado para envio direto da proposta</span>
                </div>

                <div>
                  <label className="text-slate-700 font-semibold block mb-1">
                    E-mail
                  </label>
                  <div className="relative">
                    <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      value={editingCustomer.email || ''}
                      onChange={(e) => setEditingCustomer({ ...editingCustomer, email: e.target.value })}
                      placeholder="cliente@exemplo.com"
                      className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-slate-700 font-semibold block mb-1">
                    CPF ou CNPJ
                  </label>
                  <input
                    type="text"
                    value={editingCustomer.document || ''}
                    onChange={(e) => setEditingCustomer({ ...editingCustomer, document: e.target.value })}
                    placeholder="000.000.000-00"
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div className="col-span-2">
                    <label className="text-slate-700 font-semibold block mb-1">Cidade</label>
                    <input
                      type="text"
                      value={editingCustomer.city || ''}
                      onChange={(e) => setEditingCustomer({ ...editingCustomer, city: e.target.value })}
                      placeholder="São Paulo"
                      className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="text-slate-700 font-semibold block mb-1">UF</label>
                    <input
                      type="text"
                      maxLength={2}
                      value={editingCustomer.state || ''}
                      onChange={(e) => setEditingCustomer({ ...editingCustomer, state: e.target.value.toUpperCase() })}
                      placeholder="SP"
                      className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 uppercase font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <label className="text-slate-700 font-semibold block mb-1">Endereço de Entrega (Opcional)</label>
                  <input
                    type="text"
                    value={editingCustomer.address || ''}
                    onChange={(e) => setEditingCustomer({ ...editingCustomer, address: e.target.value })}
                    placeholder="Rua, número, bairro, CEP..."
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="text-slate-700 font-semibold block mb-1">Observações Internas</label>
                  <textarea
                    rows={2}
                    value={editingCustomer.notes || ''}
                    onChange={(e) => setEditingCustomer({ ...editingCustomer, notes: e.target.value })}
                    placeholder="Ex: Peças técnicas automotivas, prefere acabamento lixado..."
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 font-medium transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-2xs transition-colors cursor-pointer"
                >
                  Salvar Cliente
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
