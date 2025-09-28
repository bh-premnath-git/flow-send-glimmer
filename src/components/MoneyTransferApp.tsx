import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Map } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';

const MoneyTransferApp: React.FC = () => {


  return (
      <Map
        initialViewState={{
          longitude: 0,
          latitude: 0,
          zoom: 1
        }}
        mapStyle="https://api.maptiler.com/maps/streets/style.json"
        style={{ width: '100vw', height: '100vh' }}
      >
      </Map>
  );
};

export default MoneyTransferApp;