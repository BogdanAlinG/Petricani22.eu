import { useEffect, useState } from 'react';
import {
  Mail,
  Phone,
  User,
  Calendar,
  MessageSquare,
  Check,
  Clock,
  CheckCircle,
  ChevronDown,
  X,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface Contact {
  id: string;
  name: string;
  email: string;
  phone: string;
  rental_period: string;
  configuration: string;
  message: string;
  language: string;
  status: string;
  currency: string;
  created_at: string;
}

export default function ContactSubmissions() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'contacted' | 'completed'>('all');

  useEffect(() => {
    fetchContacts();
  }, [filter]);

  async function fetchContacts() {
    setLoading(true);
    let query = supabase
      .from('contact_submissions')
      .select('*')
      .order('created_at', { ascending: false });

    if (filter !== 'all') {
      query = query.eq('status', filter);
    }

    const { data } = await query;
    if (data) {
      setContacts(data);
    }
    setLoading(false);
  }

  async function updateStatus(id: string, status: string) {
    await supabase.from('contact_submissions').update({ status }).eq('id', id);

    fetchContacts();
    if (selectedContact?.id === id) {
      setSelectedContact({ ...selectedContact, status });
    }
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-amber-100 text-amber-700',
      contacted: 'bg-blue-100 text-blue-700',
      completed: 'bg-green-100 text-green-700',
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4" />;
      case 'contacted':
        return <Mail className="w-4 h-4" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4" />;
      default:
        return null;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const pendingCount = contacts.filter((c) => c.status === 'pending').length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Contact Submissions</h1>
        <p className="text-gray-600">Manage customer inquiries and contact requests</p>
      </div>

      <div className="flex flex-wrap gap-3">
        {(['all', 'pending', 'contacted', 'completed'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
              filter === f
                ? 'bg-primary text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
            {f === 'pending' && pendingCount > 0 && (
              <span
                className={`px-2 py-0.5 text-xs rounded-full ${
                  filter === f ? 'bg-primary-dark text-white' : 'bg-primary/10 text-primary'
                }`}
              >
                {pendingCount}
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">
              Submissions ({contacts.length})
            </h2>
          </div>
          <div className="divide-y divide-gray-100 max-h-[calc(100vh-320px)] overflow-y-auto">
            {contacts.length === 0 ? (
              <div className="p-8 text-center text-gray-500">No submissions found</div>
            ) : (
              contacts.map((contact) => (
                <button
                  key={contact.id}
                  onClick={() => setSelectedContact(contact)}
                  className={`w-full p-4 text-left hover:bg-gray-50 transition-colors ${
                    selectedContact?.id === contact.id ? 'bg-primary/5' : ''
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="font-semibold text-gray-900">{contact.name}</div>
                      <div className="text-sm text-gray-600">{contact.email}</div>
                    </div>
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full flex items-center gap-1 ${getStatusColor(
                        contact.status
                      )}`}
                    >
                      {getStatusIcon(contact.status)}
                      {contact.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {formatDate(contact.created_at)}
                    </span>
                    <span>{contact.rental_period}</span>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">Details</h2>
          </div>
          {selectedContact ? (
            <div className="p-6 space-y-6 max-h-[calc(100vh-320px)] overflow-y-auto">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">
                    {selectedContact.name}
                  </h3>
                  <span
                    className={`inline-flex items-center gap-1 mt-2 px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(
                      selectedContact.status
                    )}`}
                  >
                    {getStatusIcon(selectedContact.status)}
                    {selectedContact.status}
                  </span>
                </div>
                <button
                  onClick={() => setSelectedContact(null)}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg lg:hidden"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-start gap-3">
                  <Mail className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <div className="text-sm text-gray-600">Email</div>
                    <a
                      href={`mailto:${selectedContact.email}`}
                      className="font-medium text-primary hover:text-primary-dark"
                    >
                      {selectedContact.email}
                    </a>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Phone className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <div className="text-sm text-gray-600">Phone</div>
                    <a
                      href={`tel:${selectedContact.phone}`}
                      className="font-medium text-primary hover:text-primary-dark"
                    >
                      {selectedContact.phone}
                    </a>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-gray-50 rounded-lg space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Rental Period</span>
                  <span className="font-medium text-gray-900">
                    {selectedContact.rental_period}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Configuration</span>
                  <span className="font-medium text-gray-900">
                    {selectedContact.configuration}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Currency</span>
                  <span className="font-medium text-gray-900">
                    {selectedContact.currency}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Language</span>
                  <span className="font-medium text-gray-900">
                    {selectedContact.language}
                  </span>
                </div>
              </div>

              {selectedContact.message && (
                <div>
                  <div className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                    <MessageSquare className="w-4 h-4" />
                    Message
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg text-gray-700 whitespace-pre-wrap">
                    {selectedContact.message}
                  </div>
                </div>
              )}

              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Calendar className="w-4 h-4" />
                Submitted: {formatDate(selectedContact.created_at)}
              </div>

              <div className="pt-4 border-t space-y-3">
                <h4 className="font-medium text-gray-900">Update Status</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedContact.status !== 'contacted' && (
                    <button
                      onClick={() => updateStatus(selectedContact.id, 'contacted')}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                    >
                      <Mail className="w-4 h-4" />
                      Mark as Contacted
                    </button>
                  )}
                  {selectedContact.status !== 'completed' && (
                    <button
                      onClick={() => updateStatus(selectedContact.id, 'completed')}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Mark as Completed
                    </button>
                  )}
                  {selectedContact.status !== 'pending' && (
                    <button
                      onClick={() => updateStatus(selectedContact.id, 'pending')}
                      className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors flex items-center gap-2"
                    >
                      <Clock className="w-4 h-4" />
                      Reset to Pending
                    </button>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-12 text-center text-gray-500">
              Select a submission to view details
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
