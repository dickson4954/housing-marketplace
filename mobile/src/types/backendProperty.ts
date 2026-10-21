export type BackendPropertyImage = {
id: string;
url: string;
altText?: string | null;
category?: string | null;
sortOrder?: number | null;
isPrimary?: boolean | null;
};

export type BackendPropertyAmenity = {
id: string;
name: string;
category?: string | null;
};

export type BackendPropertyPlace = {
id: string;
name: string;
};

export type BackendProperty = {
id: string;
title: string;
description?: string | null;

purpose?: string | null;
longStayType?: string | null;
shortStayType?: string | null;

monthlyRent?: number | null;
deposit?: number | null;
viewingFee?: number | null;
serviceCharge?: number | null;

dayRate?: number | null;
nightRate?: number | null;
dayNightRate?: number | null;
stayMode?: string | null;

bedrooms?: number | null;
bathrooms?: number | null;
beds?: number | null;
maxGuests?: number | null;
rooms?: number | null;

furnishing?: string | null;

county?: string | null;
town?: string | null;
area?: string | null;
place?: BackendPropertyPlace | null;

latitude?: number | null;
longitude?: number | null;

available?: boolean;
verified?: boolean;

videoUrl?: string | null;
videoMimeType?: string | null;

images?: BackendPropertyImage[];
amenities?: BackendPropertyAmenity[];
};

export type BackendPropertyListResponse =
| BackendProperty[]
| {
properties?: BackendProperty[];
data?: BackendProperty[];
};
