import { Component, ChangeDetectorRef, ChangeDetectionStrategy, OnInit, OnDestroy } from '@angular/core';
import { DialogService, DialogComponent } from './services/dialog.service';
import { IdleTimeoutService } from './services/idleTimeout.service';
import { Observable, from, timer, Subscription } from 'rxjs';


@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  entryComponents: [DialogComponent]
})
export class AppComponent implements OnInit, OnDestroy {

  public _counter: number = 0;
  public _status: string = "Initialized.";
  private _timer: Observable<number>;
  private _timerSubscription: Subscription;
  private _idleTimerSubscription: Subscription;

  constructor(private changeRef: ChangeDetectorRef,
    private idleTimeoutSvc: IdleTimeoutService,
    private dialogSvc: DialogService) {
  }

  public startCounter() {
    if (this._timerSubscription) {
      this._timerSubscription.unsubscribe();
    }

    this._counter = 0;
    this._timer = timer(1000, 1000);
    this._timerSubscription = this._timer.subscribe(n => {
      this._counter++;
      this.changeRef.markForCheck();
    });
  }

  public reset() {
    this.startCounter();
    this._status = "Initialized.";
    this.idleTimeoutSvc.resetTimer();
  }

  ngOnInit() {
    this.startCounter();
    this._idleTimerSubscription = this.idleTimeoutSvc.timeoutExpired.subscribe(res => {
      var modalPromise = this.dialogSvc.open("Session Expiring!", "Your session is about to expire. Do you need more time?", true, "Yes", "No");
      var newObservable = from(modalPromise);
      newObservable.subscribe(
        (res) => {
          if (res === true) {
            console.log("Extending session...");
            this._status = "Session was extended.";
            this.idleTimeoutSvc.resetTimer();
            this.startCounter();
            this.changeRef.markForCheck();

          } else {
            console.log("Not extending session...");
            this._status = "Session was not extended.";
            this.changeRef.markForCheck();
          }
        },
        (reason) => {
          console.log("Dismissed " + reason);
          this._status = "Session was not extended.";
          this.changeRef.markForCheck();
        }
      );
    });
  }

  ngOnDestroy() {
    this._idleTimerSubscription.unsubscribe();
  }
}
