import { Injectable } from '@angular/core';
import { FastIdPerson } from '../services/fastid.service';

@Injectable({ providedIn: 'root' })
export class PersonStateService {
  private person: FastIdPerson | null = null;

  setPerson(person: FastIdPerson): void {
    this.person = { ...person };
  }

  getPerson(): FastIdPerson | null {
    return this.person ? { ...this.person } : null;
  }

  hasPerson(): boolean {
    return this.person != null;
  }

  clear(): void {
    this.person = null;
  }
}
