import React from 'react';

interface GoogleMapProps {
  language: 'RO' | 'EN';
}

const GoogleMap: React.FC<GoogleMapProps> = ({ language }) => {
  const mapSrc = `https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2847.123456789!2d26.1234567!3d44.4567890!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x40b1f93abf3cfa01%3A0x12345678901234!2sPetricani%2022%2C%20Bucharest%2C%20Romania!5e0!3m2!1s${language === 'RO' ? 'ro' : 'en'}!2sro!4v1234567890123!5m2!1s${language === 'RO' ? 'ro' : 'en'}!2sro`;

  return (
    <div className="w-full h-96 rounded-xl overflow-hidden shadow-lg">
      <iframe
        src={mapSrc}
        width="100%"
        height="100%"
        style={{ border: 0 }}
        allowFullScreen
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        title={language === 'RO' ? 'Locația Petricani 22' : 'Petricani 22 Location'}
        className="w-full h-full"
      />
    </div>
  );
};

export default GoogleMap;