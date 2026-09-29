import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HeavyAnalyticsChart } from './heavy-analytics-chart';

describe('HeavyAnalyticsChart', () => {
  let component: HeavyAnalyticsChart;
  let fixture: ComponentFixture<HeavyAnalyticsChart>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HeavyAnalyticsChart],
    }).compileComponents();

    fixture = TestBed.createComponent(HeavyAnalyticsChart);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
