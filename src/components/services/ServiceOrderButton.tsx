import React, { useState } from 'react';
import { FileText } from 'lucide-react';
import ServiceCatalog from './ServiceCatalog';
import ServiceOrderFlow from './ServiceOrderFlow';
import { ServiceDefinition, ServiceSettings } from '../../types';

interface ServiceOrderButtonProps {
  variant?: 'primary' | 'secondary' | 'header';
  className?: string;
}

const ServiceOrderButton: React.FC<ServiceOrderButtonProps> = ({
  variant = 'primary',
  className = '',
}) => {
  const [showCatalog, setShowCatalog] = useState(false);
  const [selectedService, setSelectedService] = useState<ServiceDefinition | null>(null);
  const [settings, setSettings] = useState<ServiceSettings | null>(null);

  const handleSelectService = (service: ServiceDefinition, s: ServiceSettings) => {
    setSelectedService(service);
    setSettings(s);
    setShowCatalog(false);
  };

  const handleCloseFlow = () => {
    setSelectedService(null);
    setSettings(null);
  };

  const handleBackToCatalog = () => {
    setSelectedService(null);
    setSettings(null);
    setShowCatalog(true);
  };

  const baseClass =
    variant === 'header'
      ? 'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition'
      : 'flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition';

  const variantClass =
    variant === 'header'
      ? 'bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white shadow-md'
      : variant === 'secondary'
      ? 'bg-slate-800 hover:bg-slate-700 text-white'
      : 'bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white shadow-lg';

  return (
    <>
      <button
        onClick={() => setShowCatalog(true)}
        className={`${baseClass} ${variantClass} ${className}`}
      >
        <FileText className={variant === 'header' ? 'w-3.5 h-3.5' : 'w-4 h-4'} />
        <span>Order Service</span>
      </button>

      {showCatalog && (
        <ServiceCatalog
          onClose={() => setShowCatalog(false)}
          onSelectService={handleSelectService}
        />
      )}

      {selectedService && settings && (
        <ServiceOrderFlow
          service={selectedService}
          settings={settings}
          onClose={handleCloseFlow}
          onBack={handleBackToCatalog}
        />
      )}
    </>
  );
};

export default ServiceOrderButton;
