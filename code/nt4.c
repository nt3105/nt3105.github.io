#include <stdio.h>

int main(){
    int n, tam, tong = 0, tich = 1;
    do{
    	printf("Nhap N :");
		scanf("%d",&n);
		if(n <= 0){
			printf("Nhap sai. Nhap lai\n");
		}
		}while(n <= 0);
		tam = n;
		while(tam > 0){
		tong = tong + tam % 10;
		tich = tich * (tam% 10);
		tam = tam / 10;
	}
		printf("tong : %d\n",tong);
		printf("tich : %d\n",tich);	
	
    return 0;
}
