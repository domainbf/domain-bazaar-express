
import { DomainOffer } from "@/types/domain";

interface SentOffersTableProps {
  offers: DomainOffer[];
}

export const SentOffersTable = ({ offers }: SentOffersTableProps) => {
  if (offers.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-50 rounded-lg">
        <p className="text-gray-600">You haven't made any offers yet</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-gray-50">
            <th className="text-left p-4 border-b">Domain</th>
            <th className="text-left p-4 border-b">Your Offer</th>
            <th className="text-left p-4 border-b">Status</th>
            <th className="text-left p-4 border-b">Date</th>
          </tr>
        </thead>
        <tbody>
          {offers.map((offer) => (
            <tr key={offer.id} className="border-b hover:bg-gray-50">
              <td className="p-4 font-medium">{offer.domain_name}</td>
              <td className="p-4">${offer.amount}</td>
              <td className="p-4 capitalize">
                <span className={`px-2 py-1 rounded text-xs ${
                  offer.status === 'accepted' ? 'bg-green-100 text-green-800' :
                  offer.status === 'rejected' ? 'bg-red-100 text-red-800' :
                  offer.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                  'bg-yellow-100 text-yellow-800'
                }`}>
                  {offer.status}
                </span>
              </td>
              <td className="p-4">{new Date(offer.created_at).toLocaleDateString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
