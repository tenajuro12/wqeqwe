import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, Input, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Chart, ChartConfiguration, registerables } from 'chart.js';
import { CryptoService } from '../../services/crypto.service';
import { Subject, interval } from 'rxjs';
import { takeUntil, switchMap } from 'rxjs/operators';

Chart.register(...registerables);

@Component({
  selector: 'app-crypto-chart',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="chart-container">
      <div class="chart-header">
        <h3>{{ title }}</h3>
        <div class="time-selector">
          <button
            *ngFor="let period of timePeriods"
            [class.active]="selectedPeriod === period.days"
            (click)="changePeriod(period.days)">
            {{ period.label }}
          </button>
        </div>
      </div>
      <canvas #chartCanvas></canvas>
    </div>
  `,
  styles: [`
    .chart-container {
      background: white;
      border-radius: 8px;
      padding: 1.5rem;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      margin-bottom: 2rem;
    }

    .chart-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;

      h3 {
        margin: 0;
        color: #1a1a1a;
        font-size: 1.2rem;
      }
    }

    .time-selector {
      display: flex;
      gap: 0.5rem;

      button {
        padding: 0.4rem 0.8rem;
        background: #f5f5f5;
        border: 1px solid #e0e0e0;
        border-radius: 4px;
        cursor: pointer;
        font-size: 0.85rem;
        transition: all 0.3s;

        &:hover {
          background: #e0e0e0;
        }

        &.active {
          background: #3b82f6;
          color: white;
          border-color: #3b82f6;
        }
      }
    }

    canvas {
      width: 100% !important;
      height: 300px !important;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CryptoChartComponent implements OnInit, AfterViewInit, OnDestroy {
  @Input() coinId: string = 'bitcoin';
  @Input() title: string = 'Price Chart';
  @ViewChild('chartCanvas') chartCanvas!: ElementRef<HTMLCanvasElement>;

  private chart: Chart | null = null;
  private destroy$ = new Subject<void>();

  selectedPeriod = 7;
  timePeriods = [
    { label: '24H', days: 1 },
    { label: '7D', days: 7 },
    { label: '30D', days: 30 },
    { label: '90D', days: 90 }
  ];

  constructor(private cryptoService: CryptoService) {}

  ngOnInit(): void {
    interval(60000).pipe(
      takeUntil(this.destroy$),
      switchMap(() => this.cryptoService.getCryptoChart(this.coinId, this.selectedPeriod))
    ).subscribe(data => {
      this.updateChart(data.prices, data.labels);
    });
  }

  ngAfterViewInit(): void {
    this.loadChartData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    if (this.chart) {
      this.chart.destroy();
    }
  }

  changePeriod(days: number): void {
    this.selectedPeriod = days;
    this.loadChartData();
  }

  private loadChartData(): void {
    this.cryptoService.getCryptoChart(this.coinId, this.selectedPeriod)
      .subscribe(data => {
        this.createChart(data.prices, data.labels);
      });
  }

  private createChart(prices: number[], labels: string[]): void {
    if (this.chart) {
      this.chart.destroy();
    }

    const ctx = this.chartCanvas.nativeElement.getContext('2d');
    if (!ctx) return;

    const gradient = ctx.createLinearGradient(0, 0, 0, 300);
    gradient.addColorStop(0, 'rgba(59, 130, 246, 0.4)');
    gradient.addColorStop(1, 'rgba(59, 130, 246, 0.0)');

    const config: ChartConfiguration = {
      type: 'line',
      data: {
        labels: labels,
        datasets: [{
          label: 'Price (USD)',
          data: prices,
          borderColor: '#3b82f6',
          backgroundColor: gradient,
          borderWidth: 2,
          fill: true,
          tension: 0.4,
          pointRadius: 0,
          pointHoverRadius: 6,
          pointHoverBackgroundColor: '#3b82f6',
          pointHoverBorderColor: '#fff',
          pointHoverBorderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            mode: 'index',
            intersect: false,
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            titleColor: '#fff',
            bodyColor: '#fff',
            borderColor: '#3b82f6',
            borderWidth: 1,
            padding: 12,
            displayColors: false,
            callbacks: {
              label: (context) => {
                const value = context.parsed.y;
                if (value === null || value === undefined) return '';
                return `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
              }
            }
          }
        },
        scales: {
          x: {
            grid: {
              display: false
            },
            ticks: {
              maxTicksLimit: 8,
              color: '#666'
            }
          },
          y: {
            grid: {
              color: 'rgba(0, 0, 0, 0.05)'
            },
            ticks: {
              callback: (value) => {
                return `$${Number(value).toLocaleString()}`;
              },
              color: '#666'
            }
          }
        },
        interaction: {
          intersect: false,
          mode: 'index'
        }
      }
    };

    this.chart = new Chart(ctx, config);
  }

  private updateChart(prices: number[], labels: string[]): void {
    if (!this.chart) return;

    this.chart.data.labels = labels;
    this.chart.data.datasets[0].data = prices;
    this.chart.update('none');
  }
}
