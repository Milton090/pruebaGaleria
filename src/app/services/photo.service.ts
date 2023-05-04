import { Injectable } from '@angular/core';
import { Camera, CameraResultType, CameraSource, Photo } from '@capacitor/camera';
import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Preferences } from '@capacitor/preferences'; //importamos todas las librerias para utilizar la cam y el storage
import { Platform } from '@ionic/angular';


export interface UserPhoto {
  filepath: string; // ruta del archivo de la foto en el sistema de archivos del dispositivo
  // URL o ruta de acceso a la foto en la vista web de la aplicación 
  webviewPath: string | undefined; //posible error de versiones, por eso el | undefined
}

//pruebita

@Injectable({
  providedIn: 'root',
  
})

export class PhotoService {

  public photos: UserPhoto[] = []; //creamos un array de fotos
  private PHOTO_STORAGE: string = "photos"; //guardar y recuperar las fotos de la app en el local storage
  private platform: Platform

  constructor(platform: Platform) {
    this.platform = platform;
  }
  
  private async savePicture(photo: Photo) {
    // convertir foto a formato base64
    const base64Data = await this.readAsBase64(photo);
  
    // escribimos el archivo en el directorio
    const fileName = new Date().getTime() + '.jpeg';
    const savedFile = await Filesystem.writeFile({
      path: fileName,
      data: base64Data,
      directory: Directory.Data
    });

    if (this.platform.is('hybrid')) {//verificamos en que plataforma estamos
      //mostramos la img reesribiendo el archivo file:// a HTTP
      return {
        filepath: savedFile.uri,
        webviewPath: Capacitor.convertFileSrc(savedFile.uri), //convierte la ruta del archivo local en una ruta HTTP
      }
    }
    else {
      //para web, solo devolvemos la ruta de la imagen
      return {
        filepath: fileName,
        webviewPath: photo.webPath
      };
    } 
  }

  private async readAsBase64(photo: Photo) { //convertimos la foto en un string base64
    if (this.platform.is('hybrid')) { //verificamos en que plataforma estamos
      const file = await Filesystem.readFile({
        path: photo.path! //! confirmamos que no es null
      });

      return file.data;
    }
    else {
      const response = await fetch(photo.webPath!); //obtenemos la img de la direccion web
      const blob = await response.blob();
  
      return await this.convertBlobToBase64(blob) as string;
    }
  }
  
  private convertBlobToBase64 = (blob: Blob) => new Promise((resolve, reject) => {
    const reader = new FileReader();//leemo los datos 
    reader.onerror = reject;
    reader.onload = () => {
        resolve(reader.result);
    };
    reader.readAsDataURL(blob);
  });

  public async addNewToGallery() {
    // Take a photo
    const capturedPhoto = await Camera.getPhoto({ //abrimos la cam para capturar una foto
      resultType: CameraResultType.Uri,
      source: CameraSource.Camera,
      quality: 100
    });

    const saveImageFile = await this.savePicture(capturedPhoto); //guardamos la foto en el storage
    this.photos.unshift(saveImageFile); //añadimos la foto al array de fotos

    Preferences.set({ //permite almacemar y recuperar datos en el local storage, en este caso guardar
      key: this.PHOTO_STORAGE,
      value: JSON.stringify(this.photos),
    })

    //esto ya no es necesario, pues ya retornamos la foto y la guardamos arriba
    /*this.photos.unshift({
      filepath: "",
      webviewPath: capturedPhoto.webPath
    });*/

  }

  public async loadSaved(){
    const photoList = await Preferences.get({ key: this.PHOTO_STORAGE }); //obtenemos el array de fotos
    this.photos = JSON.parse(photoList?.value ?? '[]') || []; //verificamos si photoList es null, si es null, se le asigna un array vacio

    //leemos cada archivo
    if (!this.platform.is('hybrid')) {
      //mostramos la foto en formato base64
      for (let photo of this.photos) {
        const readFile = await Filesystem.readFile({
          path: photo.filepath,
          directory: Directory.Data,
        });
  
        photo.webviewPath = `data:image/jpeg;base64,${readFile.data}`;
      }
    }
  }

  public async deletePicture(photo: UserPhoto, position: number) {
    this.photos.splice(position, 1);//elimina la foto del array en la posicion indicada
  
    Preferences.set({//guardamos el array actualizado
      key: this.PHOTO_STORAGE,
      value: JSON.stringify(this.photos)
    });
  
    const filename = photo.filepath
                        .substr(photo.filepath.lastIndexOf('/') + 1); // obtenemos el nombre del archivo 
  
    await Filesystem.deleteFile({ // eliminamos
      path: filename,
      directory: Directory.Data
    });
  }
}
