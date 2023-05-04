import { Component } from '@angular/core';
import { PhotoService, UserPhoto } from '../services/photo.service';
import { ActionSheetController } from '@ionic/angular';

@Component({
  selector: 'app-tab2',
  templateUrl: 'tab2.page.html',
  styleUrls: ['tab2.page.scss']
})
export class Tab2Page {

  constructor(public photoService: PhotoService, public actionSheetController: ActionSheetController) {}
  addPhotoToGallery() {
    this.photoService.addNewToGallery(); //llamamos al metodo de la camara
  }

  async ngOnInit() {
    await this.photoService.loadSaved(); // al entrar a tab2 las fotos se cargan y se muestran en la pantalla
  }

  public async showActionSheet(photo: UserPhoto, position: number) {
    const actionSheet = await this.actionSheetController.create({
      header: 'Photos',
      buttons: [{
        text: 'Delete bro',
        role: 'destructive',
        icon: 'trash',
        handler: () => {
          this.photoService.deletePicture(photo, position);
        }
      }, {
        text: 'Cancel mi so',
        icon: 'close',
        role: 'cancel',
        handler: () => {

          }
      }]
    });
    await actionSheet.present();
  }
  
}
