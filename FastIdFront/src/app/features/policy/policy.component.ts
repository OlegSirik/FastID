import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { catchError, of } from 'rxjs';
import { AuthService } from '../../core/auth.service';
import { PersonStateService } from '../../core/person-state.service';
import {
  FASTID_OFFERS,
  FastIdOfferConfig,
  FastIdPerson,
  FastIdService,
} from '../../services/fastid.service';
import { InsuranceCatalogComponent } from '../../shared/components/insurance-catalog/insurance-catalog.component';
import { InsuranceSelectionService } from '../../core/insurance-selection.service';

interface OfferState extends FastIdOfferConfig {
  premium?: number | null;
  loading: boolean;
  error?: string;
}

@Component({
  selector: 'app-policy',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    InsuranceCatalogComponent,
  ],
  templateUrl: './policy.component.html',
  styleUrl: './policy.component.scss',
})
export class PolicyComponent implements OnInit {
  private fastId = inject(FastIdService);
  private personState = inject(PersonStateService);
  private auth = inject(AuthService);
  private router = inject(Router);
  private insuranceSelection = inject(InsuranceSelectionService);
  private destroyRef = inject(DestroyRef);

  person: FastIdPerson | null = null;
  offers: OfferState[] = [];

  get showNsOffers(): boolean {
    return this.insuranceSelection.selectedId === 'ns';
  }

  ngOnInit(): void {
    this.person = this.personState.getPerson();
    if (!this.person) {
      this.router.navigate(['/', this.auth.tenant, 'start']);
      return;
    }
    this.loadOffersForSelection();
    this.insuranceSelection
      .selectedIdChanges()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.loadOffersForSelection());
  }

  private loadOffersForSelection(): void {
    if (!this.showNsOffers) {
      this.offers = [];
      return;
    }
    this.offers = FASTID_OFFERS.map((o) => ({ ...o, loading: true }));
    for (const offer of this.offers) {
      this.loadPremium(offer);
    }
  }

  private loadPremium(offer: OfferState): void {
    offer.loading = true;
    this.fastId
      .calculatePremium({
        ...this.person!,
        productCode: offer.productCode,
        packageCode: offer.packageCode,
      })
      .pipe(
        catchError((err) =>
          of({
            productCode: offer.productCode,
            errorMessage: err?.error?.message || 'Ошибка расчёта',
          }),
        ),
      )
      .subscribe((res) => {
        offer.loading = false;
        if ('premium' in res && res.premium != null) {
          offer.premium = Number(res.premium);
        } else {
          offer.error = ('errorMessage' in res && res.errorMessage) || 'Премия недоступна';
        }
      });
  }

  formatPremium(offer: OfferState): string {
    if (offer.loading) {
      return '…';
    }
    if (offer.premium != null) {
      return `${offer.premium.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₽`;
    }
    return offer.error || '—';
  }

  onBuy(offer: OfferState): void {
    if (offer.premium == null) {
      return;
    }
    console.info('Buy', offer.productCode, this.person);
  }

  backToStart(): void {
    this.router.navigate(['/', this.auth.tenant, 'start']);
  }
}
