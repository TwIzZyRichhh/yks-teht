import {Point} from './Point';

type Restaurant = {
    _id: string;
    companyId: number;
    name: string;
    address: string;
    postalCode: string;
    city: string;
    phone: string;
    company: string;
    location: Point;
}

export {Restaurant}
